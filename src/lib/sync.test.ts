import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as sync from './sync'
import { apiFetch } from './api'
import { useMacroStore } from '../store/useMacroStore'

// Mock chrome APIs
const mockGet = vi.fn()
const mockSet = vi.fn()
const mockSendMessage = vi.fn(() => Promise.resolve())

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: mockGet,
      set: mockSet
    }
  },
  runtime: {
    sendMessage: mockSendMessage
  }
})

// Mock api module
vi.mock('./api', () => ({
  apiFetch: vi.fn()
}))

// apiFetch resolves a full Response. The code under test reads only `ok` and `json`,
// so the stubs supply those and this names the narrowing rather than repeating a cast.
const stubResponse = (body: Partial<Response>) => body as Response

// Mock store
vi.mock('../store/useMacroStore', () => ({
  useMacroStore: {
    getState: vi.fn(() => ({
      setMacros: vi.fn()
    }))
  }
}))

describe('sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // syncEnabled: true so the network path runs; the disabled case is tested separately.
    vi.mocked(useMacroStore.getState).mockReturnValue({
      macros: [],
      setMacros: vi.fn(),
      config: { syncEnabled: true }
    } as any)
    // Default: empty offline queue
    mockGet.mockResolvedValue({ pendingOps: [] })
  })

  // The store is the local source of truth; these helpers only push to the
  // backend (and queue on failure). They must NOT write macros to storage.

  describe('sync disabled (default)', () => {
    it('makes no network calls when config.syncEnabled is not true', async () => {
      vi.mocked(useMacroStore.getState).mockReturnValue({
        macros: [],
        setMacros: vi.fn(),
        config: { syncEnabled: false }
      } as any)

      await sync.pushCreate({ id: 1, command: '/test', text: 'x' })
      await sync.pushUpdate({ id: 1, command: '/test', text: 'x' })
      await sync.pushDelete(1)
      await sync.syncMacros()
      await sync.flushQueue()

      expect(apiFetch).not.toHaveBeenCalled()
      expect(mockSet).not.toHaveBeenCalled()
    })
  })

  describe('pushCreate', () => {
    it('pushes the create to the backend and does not touch storage on success', async () => {
      const macro = { id: 1, command: '/test', text: 'test text' }
      vi.mocked(apiFetch).mockResolvedValueOnce(stubResponse({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      }))

      await sync.pushCreate(macro)

      expect(apiFetch).toHaveBeenCalledWith('/macros', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(macro)
      }))
      expect(mockSet).not.toHaveBeenCalled()
    })

    it('queues the operation when the remote push fails', async () => {
      const macro = { id: 1, command: '/test', text: 'test text' }
      vi.mocked(apiFetch).mockResolvedValueOnce(stubResponse({ ok: false }))

      await sync.pushCreate(macro)

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        pendingOps: expect.arrayContaining([
          expect.objectContaining({ op: 'create', macro })
        ])
      }))
    })
  })

  describe('pushUpdate', () => {
    it('pushes the update to the backend on success', async () => {
      const macro = { id: 1, command: '/updated', text: 'updated text' }
      vi.mocked(apiFetch).mockResolvedValueOnce(stubResponse({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      }))

      await sync.pushUpdate(macro)

      expect(apiFetch).toHaveBeenCalledWith('/macros/1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(macro)
      }))
      expect(mockSet).not.toHaveBeenCalled()
    })

    it('queues the operation when the remote push fails', async () => {
      const macro = { id: 1, command: '/updated', text: 'updated text' }
      vi.mocked(apiFetch).mockResolvedValueOnce(stubResponse({ ok: false }))

      await sync.pushUpdate(macro)

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        pendingOps: expect.arrayContaining([
          expect.objectContaining({ op: 'update', macro })
        ])
      }))
    })
  })

  describe('pushDelete', () => {
    it('pushes the delete to the backend on success', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce(stubResponse({ ok: true }))

      await sync.pushDelete(1)

      expect(apiFetch).toHaveBeenCalledWith('/macros/1', expect.objectContaining({
        method: 'DELETE'
      }))
      expect(mockSet).not.toHaveBeenCalled()
    })

    it('queues the operation when the remote push fails', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce(stubResponse({ ok: false }))

      await sync.pushDelete(1)

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        pendingOps: expect.arrayContaining([
          expect.objectContaining({ op: 'delete', id: 1 })
        ])
      }))
    })
  })

  describe('syncMacros', () => {
    it('pulls remote, merges with the store, and writes the merge to the store', async () => {
      const remoteMacros = [
        { id: 1, command: '/remote', text: 'remote text', updated_at: '2023-01-01T00:00:00Z' }
      ]
      const localMacros = [
        { id: 1, command: '/local', text: 'local text', updated_at: '2023-01-02T00:00:00Z' },
        { id: 2, command: '/local-only', text: 'local only text', updated_at: '2023-01-01T00:00:00Z' }
      ]
      vi.mocked(apiFetch).mockResolvedValueOnce(stubResponse({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: remoteMacros })
      }))

      const mockSetMacros = vi.fn()
      vi.mocked(useMacroStore.getState).mockReturnValue({
        macros: localMacros,
        setMacros: mockSetMacros,
        config: { syncEnabled: true }
      } as any)

      await sync.syncMacros()

      // Newer local version wins; the store is the only thing written.
      expect(mockSetMacros).toHaveBeenCalledWith([
        expect.objectContaining({ id: 1, command: '/local', text: 'local text' }),
        expect.objectContaining({ id: 2, command: '/local-only', text: 'local only text' })
      ])
    })
  })

  describe('flushQueue', () => {
    it('processes pending operations and clears successful ones', async () => {
      const pendingOps = [
        { op: 'create', macro: { id: 1, command: '/test', text: 'test' }, ts: Date.now() },
        { op: 'update', macro: { id: 2, command: '/update', text: 'update' }, ts: Date.now() }
      ]
      mockGet.mockResolvedValue({ pendingOps })
      vi.mocked(apiFetch)
        .mockResolvedValueOnce(stubResponse({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) }))
        .mockResolvedValueOnce(stubResponse({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) }))

      await sync.flushQueue()

      expect(mockSet).toHaveBeenCalledWith({ pendingOps: [] })
    })

    it('keeps failed operations in the queue', async () => {
      const pendingOps = [
        { op: 'create', macro: { id: 1, command: '/test', text: 'test' }, ts: Date.now() }
      ]
      mockGet.mockResolvedValue({ pendingOps })
      vi.mocked(apiFetch).mockResolvedValueOnce(stubResponse({ ok: false }))

      await sync.flushQueue()

      expect(mockSet).toHaveBeenCalledWith({
        pendingOps: expect.arrayContaining([
          expect.objectContaining({ op: 'create', macro: { id: 1, command: '/test', text: 'test' } })
        ])
      })
    })
  })
})
