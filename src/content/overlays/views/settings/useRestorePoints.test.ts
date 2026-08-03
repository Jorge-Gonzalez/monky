// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../../../../types'
import type { RestorePoint, RestoreRead } from '../../../../store/restorePoints'
import type { BackupHealth } from '../../../../store/backupHealth'
import type { SyncUsage } from '../../../../store/syncBackup'

vi.mock('../../../../lib/i18n', () => ({
  t: (key: string, opts?: Record<string, string>) => (opts ? `${key}:${Object.values(opts).join(',')}` : key),
}))

const listRestorePoints = vi.fn<() => Promise<RestorePoint[]>>()
vi.mock('../../../../store/restorePoints', () => ({ listRestorePoints: () => listRestorePoints() }))

const keepPrevious = vi.fn()
vi.mock('../../../../store/macroPrevious', () => ({
  keepPrevious: (macros: Macro[], reason: string) => keepPrevious(macros, reason),
}))

const readBackupHealth = vi.fn<() => Promise<BackupHealth | null>>()
vi.mock('../../../../store/backupHealth', () => ({ readBackupHealth: () => readBackupHealth() }))

const syncUsage = vi.fn<() => Promise<SyncUsage>>()
vi.mock('../../../../store/syncBackup', () => ({ syncUsage: () => syncUsage() }))

const setMacros = vi.fn()
const currentMacros: Macro[] = [{ id: 'live', command: '/live', text: 'now' }]
vi.mock('../../../../store/useMacroStore', () => ({
  useMacroStore: { getState: () => ({ macros: currentMacros, setMacros }) },
}))

import { useRestorePoints } from './useRestorePoints'

const restored: Macro[] = [{ id: 'old', command: '/old', text: 'then' }]

const point = (read: () => Promise<RestoreRead>, over: Partial<RestorePoint> = {}): RestorePoint => ({
  id: 'p1',
  at: '2026-08-03T12:00:00.000Z',
  reason: 'delete',
  count: 2,
  fromAnotherDevice: false,
  checksum: 'c',
  read,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  listRestorePoints.mockResolvedValue([])
  readBackupHealth.mockResolvedValue({ at: 'x', status: 'ok' })
  syncUsage.mockResolvedValue({ used: 5120, total: 102_400, fraction: 0.05 })
  keepPrevious.mockResolvedValue(null)
})

describe('useRestorePoints', () => {
  it('loads the points, the health and the room left', async () => {
    listRestorePoints.mockResolvedValue([point(() => Promise.resolve({ status: 'read', macros: restored }))])
    const { result } = renderHook(() => useRestorePoints())
    await waitFor(() => expect(result.current.points).toHaveLength(1))
    expect(result.current.health).toEqual({ at: 'x', status: 'ok' })
    expect(result.current.usage?.used).toBe(5120)
  })

  describe('restore', () => {
    it('keeps the set being replaced before replacing it', async () => {
      // Restoring is itself destructive. Without this, recovering to the wrong moment would be the
      // one act in the app with no way back.
      const p = point(() => Promise.resolve({ status: 'read', macros: restored }))
      const { result } = renderHook(() => useRestorePoints())
      await act(async () => {
        await result.current.restore(p)
      })
      expect(keepPrevious).toHaveBeenCalledWith(currentMacros, 'restore')
      expect(setMacros).toHaveBeenCalledWith(restored)
    })

    it('keeps it before, not after', async () => {
      const order: string[] = []
      keepPrevious.mockImplementation(() => {
        order.push('kept')
        return Promise.resolve(null)
      })
      setMacros.mockImplementation(() => order.push('replaced'))
      const p = point(() => Promise.resolve({ status: 'read', macros: restored }))
      const { result } = renderHook(() => useRestorePoints())
      await act(async () => {
        await result.current.restore(p)
      })
      expect(order).toEqual(['kept', 'replaced'])
    })

    it('says how many came back', async () => {
      const p = point(() => Promise.resolve({ status: 'read', macros: restored }))
      const { result } = renderHook(() => useRestorePoints())
      await act(async () => {
        await result.current.restore(p)
      })
      expect(result.current.status).toEqual({ ok: true, message: 'settings.recover.status.restored:1' })
    })

    it.each([
      ['none', 'settings.recover.status.none'],
      ['incomplete', 'settings.recover.status.incomplete'],
      ['corrupt', 'settings.recover.status.corrupt'],
    ])('reports %s distinctly rather than as one generic failure', async (status, key) => {
      // Only 'incomplete' is worth trying again, and collapsing the three would hide that.
      const p = point(() => Promise.resolve({ status } as RestoreRead))
      const { result } = renderHook(() => useRestorePoints())
      await act(async () => {
        await result.current.restore(p)
      })
      expect(result.current.status).toEqual({ ok: false, message: key })
    })

    it('changes nothing at all when the point could not be read', async () => {
      const p = point(() => Promise.resolve({ status: 'corrupt' }))
      const { result } = renderHook(() => useRestorePoints())
      await act(async () => {
        await result.current.restore(p)
      })
      expect(setMacros).not.toHaveBeenCalled()
      expect(keepPrevious).not.toHaveBeenCalled()
    })
  })
})
