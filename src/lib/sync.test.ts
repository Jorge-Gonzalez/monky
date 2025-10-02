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
  })

  describe('createMacroLocalFirst', () => {
    it('creates macro locally and attempts remote sync', async () => {
      const macro = { id: 1, command: '/test', text: 'test text' };
      
      // Mock local storage
      mockGet.mockImplementation(async (keys) => {
        if (keys === 'macros') return { macros: [] };
        if (keys === 'pendingOps') return { pendingOps: [] };
        return {};
      });
      
      // Mock successful API response
      ;(apiFetch as vi.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true })
        })
      
      await sync.createMacroLocalFirst(macro)
      
      // Should have saved to local storage
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        macros: expect.arrayContaining([
          expect.objectContaining(macro)
        ])
      }))
      
      // Should have attempted API call
      expect(apiFetch).toHaveBeenCalledWith('/macros', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(macro)
      }))
    })

    it('queues operation when remote sync fails', async () => {
      const macro = { id: 1, command: '/test', text: 'test text' }
      
      // Mock local storage
      mockGet.mockImplementation(async (keys) => {
        if (keys === 'macros') return { macros: [] };
        if (keys === 'pendingOps') return { pendingOps: [] };
        return {};
      });
      
      // Mock failed API response
      ;(apiFetch as vi.Mock)
        .mockResolvedValueOnce({
          ok: false // Network error
        })
      
      await sync.createMacroLocalFirst(macro)
      
      // Should still have saved locally
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        macros: expect.arrayContaining([
          expect.objectContaining(macro)
        ])
      }))
      
      // Should have queued the operation
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        pendingOps: expect.arrayContaining([
          expect.objectContaining({
            op: 'create',
            macro: macro
          })
        ])
      }))
    })
  })

  describe('updateMacroLocalFirst', () => {
    it('updates macro locally and attempts remote sync', async () => {
      const macro = { id: 1, command: '/updated', text: 'updated text' }
      const existingMacros = [{ id: 1, command: '/test', text: 'test text' }]
      
      // Mock local storage
      mockGet.mockImplementation(async (keys) => {
        if (keys === 'macros') return { macros: existingMacros };
        if (keys === 'pendingOps') return { pendingOps: [] };
        return {};
      });
      
      // Mock successful API response
      ;(apiFetch as vi.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true })
        })
      
      await sync.updateMacroLocalFirst(macro)
      
      // Should have updated local storage
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        macros: [expect.objectContaining(macro)]
      }))
      
      // Should have attempted API call
      expect(apiFetch).toHaveBeenCalledWith('/macros/1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(macro)
      }))
    })
  })

  describe('deleteMacroLocalFirst', () => {
    it('deletes macro locally and attempts remote sync', async () => {
      const macroId = 1
      const existingMacros = [
        { id: 1, command: '/test', text: 'test text' },
        { id: 2, command: '/another', text: 'another text' }
      ]
      
      // Mock local storage
      mockGet.mockImplementation(async (keys) => {
        if (keys === 'macros') return { macros: existingMacros };
        if (keys === 'pendingOps') return { pendingOps: [] };
        return {};
      });
      
      // Mock successful API response
      ;(apiFetch as vi.Mock)
        .mockResolvedValueOnce({
          ok: true
        })
      
      await sync.deleteMacroLocalFirst(macroId)
      
      // Should have removed from local storage
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        macros: [expect.objectContaining({ id: 2 })]
      }))
      expect(mockSet).not.toHaveBeenCalledWith(expect.objectContaining({
        macros: expect.arrayContaining([expect.objectContaining({ id: 1 })])
      }))
      
      // Should have attempted API call
      expect(apiFetch).toHaveBeenCalledWith('/macros/1', expect.objectContaining({
        method: 'DELETE'
      }))
    })
  })

  describe('syncMacros', () => {
    it('syncs macros from remote and merges with local data', async () => {
      const remoteMacros = [
        { id: 1, command: '/remote', text: 'remote text', updated_at: '2023-01-01T00:00:00Z' }
      ]
      const localMacros = [
        { id: 1, command: '/local', text: 'local text', updated_at: '2023-01-02T00:00:00Z' },
        { id: 2, command: '/local-only', text: 'local only text', updated_at: '2023-01-01T00:00:00Z' }
      ]
      
      // Mock API response
      ;(apiFetch as vi.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true, data: remoteMacros })
        })
      
      // Mock local storage
      mockGet.mockImplementation(async (keys) => {
        if (keys === 'macros') return { macros: localMacros };
        if (keys === 'pendingOps') return { pendingOps: [] };
        return {};
      });
      
      // Mock store update
      const mockSetMacros = vi.fn()
      ;(useMacroStore.getState as vi.Mock).mockReturnValue({
        setMacros: mockSetMacros
      })
      
      await sync.syncMacros()
      
      // Should have merged macros correctly (newer local version should win)
      expect(mockSetMacros).toHaveBeenCalledWith([
        expect.objectContaining({ 
          id: 1, 
          command: '/local', 
          text: 'local text' 
        }),
        expect.objectContaining({ 
          id: 2, 
          command: '/local-only',
          text: 'local only text'
        })
      ])
    })
  })

  describe('flushQueue', () => {
    it('processes pending operations and clears successful ones', async () => {
      const pendingOps = [
        { op: 'create', macro: { id: 1, command: '/test', text: 'test' }, ts: Date.now() },
        { op: 'update', macro: { id: 2, command: '/update', text: 'update' }, ts: Date.now() }
      ]
      
      // Mock queue retrieval
      mockGet.mockResolvedValue({ pendingOps })
      
      // Mock successful API responses
      ;(apiFetch as vi.Mock)
        .mockResolvedValueOnce({ // First create
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true })
        })
        .mockResolvedValueOnce({ // Then update
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true })
        })
      
      await sync.flushQueue()
      
      // Should have cleared the queue
      expect(mockSet).toHaveBeenCalledWith({ pendingOps: [] })
    })

    it('keeps failed operations in the queue', async () => {
      const pendingOps = [
        { op: 'create', macro: { id: 1, command: '/test', text: 'test' }, ts: Date.now() }
      ]
      
      // Mock queue retrieval
      mockGet.mockResolvedValue({ pendingOps })
      
      // Mock failed API response
      ;(apiFetch as vi.Mock)
        .mockResolvedValueOnce({
          ok: false // Failed operation
        })
      
      await sync.flushQueue()
      
      // Should keep the failed operation in the queue
      expect(mockSet).toHaveBeenCalledWith({ 
        pendingOps: expect.arrayContaining([
          expect.objectContaining({
            op: 'create',
            macro: { id: 1, command: '/test', text: 'test' }
          })
        ])
      })
    })
  })
})