import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadMacros, listenMacrosChange, loadStoredMacros } from './macroStorage'

// Mock chrome APIs
const mockGet = vi.fn()
const mockAddListener = vi.fn()

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: mockGet,
    },
    onChanged: {
      addListener: mockAddListener,
    },
  },
})

describe('macroStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadMacros', () => {
    it('loads macros from chrome storage', async () => {
      const mockMacros = [
        { id: 1, command: '/test', text: 'test text' },
        { id: 2, trigger: ';hello', text: 'hello world' },
      ]

      mockGet.mockResolvedValueOnce({ 'macro-storage': { state: { macros: mockMacros } } })

      const result = await loadMacros()

      expect(result).toEqual([
        {
          id: 1,
          command: '/test',
          text: 'test text',
          html: undefined,
          contentType: undefined,
          is_sensitive: undefined,
        },
        {
          id: 2,
          command: ';hello',
          text: 'hello world',
          html: undefined,
          contentType: undefined,
          is_sensitive: undefined,
        },
      ])
      expect(mockGet).toHaveBeenCalledWith('macro-storage')
    })

    it('should correctly map new properties', async () => {
      const mockMacros = [
        {
          id: 1,
          command: '/html',
          text: 'html text',
          html: '<b>html</b>',
          contentType: 'text/html',
          is_sensitive: true,
        },
      ]
      mockGet.mockResolvedValueOnce({ 'macro-storage': { state: { macros: mockMacros } } })
      const result = await loadMacros()
      expect(result).toEqual(mockMacros)
      expect(mockGet).toHaveBeenCalledWith('macro-storage')
    })

    it('returns empty array when no macros exist', async () => {
      mockGet.mockResolvedValueOnce({})

      const result = await loadMacros()

      expect(result).toEqual([])
    })

    it('handles malformed macros gracefully', async () => {
      const malformedMacros = [
        { id: 1 }, // Missing command and text
        { id: 2, command: '/test' }, // Missing text
        { id: 3, text: 'test text' }, // Missing command
      ]

      mockGet.mockResolvedValueOnce({ 'macro-storage': { state: { macros: malformedMacros } } })

      const result = await loadMacros()

      expect(result).toEqual([
        { id: 1, command: '', text: '', html: undefined, contentType: undefined, is_sensitive: undefined },
        {
          id: 2,
          command: '/test',
          text: '',
          html: undefined,
          contentType: undefined,
          is_sensitive: undefined,
        },
        {
          id: 3,
          command: '',
          text: 'test text',
          html: undefined,
          contentType: undefined,
          is_sensitive: undefined,
        },
      ])
    })

    it('handles non-array macro storage', async () => {
      mockGet.mockResolvedValueOnce({ 'macro-storage': { state: { macros: 'not-an-array' } } })

      const result = await loadMacros()

      expect(result).toEqual([])
    })
  })

  describe('loadStoredMacros', () => {
    it('returns the stored macros without reshaping them', async () => {
      // The narrowing view keeps six fields; a backup has to keep whatever was written, or a
      // restore silently drops what it never knew about.
      const stored = [
        {
          id: 1,
          command: '/a',
          text: 'A',
          contentType: 'text/plain',
          updated_at: '2026-07-31T06:25:07.947Z',
        },
      ]
      mockGet.mockResolvedValue({ 'macro-storage': JSON.stringify({ state: { macros: stored } }) })
      expect(await loadStoredMacros()).toEqual(stored)
    })

    it('returns null rather than an empty list when there is nothing stored', async () => {
      // The difference matters to the baseline snapshot: absent storage must not be recorded as
      // a library with nothing in it, which would put an empty backup at the head of the history.
      mockGet.mockResolvedValue({})
      expect(await loadStoredMacros()).toBeNull()
    })

    it('returns null when the stored value is not a macro list', async () => {
      mockGet.mockResolvedValue({ 'macro-storage': JSON.stringify({ state: { macros: 'broken' } }) })
      expect(await loadStoredMacros()).toBeNull()
    })
  })

  describe('listenMacrosChange', () => {
    it('registers a listener for macro changes', () => {
      const callback = vi.fn()

      listenMacrosChange(callback)

      expect(mockAddListener).toHaveBeenCalled()
      expect(typeof mockAddListener.mock.calls[0][0]).toBe('function')
    })

    it('processes macro changes correctly', () => {
      const callback = vi.fn()
      const mockMacros = [
        { id: 1, command: '/test', text: 'test text' },
        { id: 2, trigger: ';hello', text: 'hello world' },
      ]

      listenMacrosChange(callback)

      // Get the registered listener function
      const listener = mockAddListener.mock.calls[0][0]

      // Call the listener with mock change data
      listener({ 'macro-storage': { newValue: { state: { macros: mockMacros } } } }, 'local')

      expect(callback).toHaveBeenCalledWith([
        {
          id: 1,
          command: '/test',
          text: 'test text',
          html: undefined,
          contentType: undefined,
          is_sensitive: undefined,
        },
        {
          id: 2,
          command: ';hello',
          text: 'hello world',
          html: undefined,
          contentType: undefined,
          is_sensitive: undefined,
        },
      ])
    })

    it('ignores changes in non-local storage areas', () => {
      const callback = vi.fn()

      listenMacrosChange(callback)

      const listener = mockAddListener.mock.calls[0][0]
      listener({ 'macro-storage': { newValue: { state: { macros: [] } } } }, 'sync')

      expect(callback).not.toHaveBeenCalled()
    })

    it('handles missing newValue gracefully', () => {
      const callback = vi.fn()

      listenMacrosChange(callback)

      const listener = mockAddListener.mock.calls[0][0]
      listener({ 'macro-storage': {} }, 'local') // No newValue

      expect(callback).toHaveBeenCalledWith([])
    })
  })
})
