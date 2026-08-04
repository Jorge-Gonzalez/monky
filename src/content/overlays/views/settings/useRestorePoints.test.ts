// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../../../../types'
import type { RestorePoint, RestoreRead } from '../../../../store/restorePoints'
import type { BackupHealth } from '../../../../store/backupHealth'
import type * as BackupHealthModule from '../../../../store/backupHealth'
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

// Only the storage read is faked. describeBackupState is the thing under test here, so stubbing it
// would leave these cases asserting a mock's return value.
const readBackupHealth = vi.fn<() => Promise<BackupHealth | null>>()
vi.mock('../../../../store/backupHealth', async () => {
  const actual = await vi.importActual<typeof BackupHealthModule>('../../../../store/backupHealth')
  return { ...actual, readBackupHealth: () => readBackupHealth() }
})

const syncUsage = vi.fn<() => Promise<SyncUsage>>()
vi.mock('../../../../store/syncBackup', () => ({ syncUsage: () => syncUsage() }))

// checksum is real: the point of these cases is the comparison, so faking it would test nothing.

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
  it('loads the points and the room left', async () => {
    listRestorePoints.mockResolvedValue([point(() => Promise.resolve({ status: 'read', macros: restored }))])
    const { result } = renderHook(() => useRestorePoints())
    await waitFor(() => expect(result.current.points).toHaveLength(1))
    expect(result.current.usage?.used).toBe(5120)
  })

  describe('the state it reports', () => {
    // Derived from the live library against the committed copy, never from the last attempt alone.
    // The bug this replaces: a backup succeeds, the user edits, the alarm has not fired, and the
    // line still says "protected" about a library that is not.
    const automatic = (checksum: string) =>
      point(() => Promise.resolve({ status: 'read', macros: restored }), {
        id: 'backup',
        reason: 'automatic',
        checksum,
      })

    it('says pending when the library has moved on since the committed copy', async () => {
      listRestorePoints.mockResolvedValue([automatic('some-other-checksum')])
      const { result } = renderHook(() => useRestorePoints())
      await waitFor(() => expect(result.current.state).toBe('pending'))
    })

    it('says ok when the committed copy is the library on this device', async () => {
      const { checksumMacros } = await import('../../../../store/checksum')
      listRestorePoints.mockResolvedValue([automatic(checksumMacros(currentMacros))])
      const { result } = renderHook(() => useRestorePoints())
      await waitFor(() => expect(result.current.state).toBe('ok'))
    })

    it('says never when nothing has been committed', async () => {
      listRestorePoints.mockResolvedValue([])
      const { result } = renderHook(() => useRestorePoints())
      await waitFor(() => expect(result.current.usage).not.toBeNull())
      expect(result.current.state).toBe('never')
    })

    it('carries the size when the library no longer fits', async () => {
      readBackupHealth.mockResolvedValue({ at: 'x', status: 'too-large', bytes: 51_200 })
      listRestorePoints.mockResolvedValue([])
      const { result } = renderHook(() => useRestorePoints())
      await waitFor(() => expect(result.current.state).toBe('too-large'))
      expect(result.current.detail).toBe('50')
    })

    it('carries the message when the platform refused', async () => {
      readBackupHealth.mockResolvedValue({ at: 'x', status: 'failed', detail: 'quota exceeded' })
      listRestorePoints.mockResolvedValue([])
      const { result } = renderHook(() => useRestorePoints())
      await waitFor(() => expect(result.current.state).toBe('failed'))
      expect(result.current.detail).toBe('quota exceeded')
    })
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
