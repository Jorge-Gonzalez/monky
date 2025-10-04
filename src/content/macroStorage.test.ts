import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadMacros, listenMacrosChange } from './macroStorage'

// Mock chrome APIs
const mockGet = vi.fn()
const mockAddListener = vi.fn()

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: mockGet
    },
    onChanged: {
      addListener: mockAddListener
    }
  }
})

describe('macroStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadMacros', () => {
    it('loads macros from chrome storage', async () => {
      const mockMacros = [
        { id: 1, command: '/test', text: 'test text' },
        { id: 2, trigger: ';hello', text: 'hello world' }
      ]
      
      mockGet.mockResolvedValueOnce({ 'macro-storage': { state: { macros: mockMacros } } })
      
      const result = await loadMacros()
      
      expect(result).toEqual([
        { id: 1, command: '/test', text: 'test text', html: undefined, contentType: undefined, is_sensitive: undefined },
        { id: 2, command: ';hello', text: 'hello world', html: undefined, contentType: undefined, is_sensitive: undefined }
      ])
      expect(mockGet).toHaveBeenCalledWith('macro-storage')
    })

    it('should correctly map new properties', async () => {
      const mockMacros = [
        { id: 1, command: '/html', text: 'html text', html: '<b>html</b>', contentType: 'text/html', is_sensitive: true },
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
        { id: 3, text: 'test text' } // Missing command
      ]
      
      mockGet.mockResolvedValueOnce({ 'macro-storage': { state: { macros: malformedMacros } } })
      
      const result = await loadMacros()
      
      expect(result).toEqual([
        { id: 1, command: '', text: '', html: undefined, contentType: undefined, is_sensitive: undefined },
        { id: 2, command: '/test', text: '', html: undefined, contentType: undefined, is_sensitive: undefined },
        { id: 3, command: '', text: 'test text', html: undefined, contentType: undefined, is_sensitive: undefined }
      ])
    })

    it('handles non-array macro storage', async () => {
      mockGet.mockResolvedValueOnce({ 'macro-storage': { state: { macros: 'not-an-array' } } })
      
      const result = await loadMacros()
      
      expect(result).toEqual([])
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
        { id: 2, trigger: ';hello', text: 'hello world' }
      ]
      
      listenMacrosChange(callback)
      
      // Get the registered listener function
      const listener = mockAddListener.mock.calls[0][0]
      
      // Call the listener with mock change data
      listener({ 'macro-storage': { newValue: { state: { macros: mockMacros } } } }, 'local')
      
      expect(callback).toHaveBeenCalledWith([
        { id: 1, command: '/test', text: 'test text', html: undefined, contentType: undefined, is_sensitive: undefined },
        { id: 2, command: ';hello', text: 'hello world', html: undefined, contentType: undefined, is_sensitive: undefined }
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