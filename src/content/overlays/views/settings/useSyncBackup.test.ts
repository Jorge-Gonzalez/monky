// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../../../../types'
import type { BackupManifest, BackupReadResult, SyncUsage } from '../../../../store/syncBackup'
import type { EditEvent } from '../../../../store/editLog'

vi.mock('../../../../lib/i18n', () => ({
  t: (key: string, opts?: Record<string, string>) => (opts ? `${key}:${Object.values(opts).join(',')}` : key),
}))

const writeBackup = vi.fn<() => Promise<{ status: string; manifest?: BackupManifest; needed?: number }>>()
const backupStatus = vi.fn<() => Promise<BackupManifest | null>>()
const readBackup = vi.fn<() => Promise<BackupReadResult>>()
const syncUsage = vi.fn<() => Promise<SyncUsage>>()
vi.mock('../../../../store/syncBackup', () => ({
  backupStatus: () => backupStatus(),
  readBackup: () => readBackup(),
  syncUsage: () => syncUsage(),
  writeBackup: (...a: unknown[]) => writeBackup(...(a as [])),
}))

const readEditLog = vi.fn<() => Promise<EditEvent[]>>()
vi.mock('../../../../store/editLog', () => ({ readEditLog: () => readEditLog() }))

const takeSnapshot = vi.fn()
vi.mock('../../../../store/macroSnapshots', () => ({
  takeSnapshot: (macros: Macro[], opts?: { force?: boolean }) => takeSnapshot(macros, opts),
}))

vi.mock('../../../../lib/deviceId', () => ({ deviceId: () => Promise.resolve('this-device') }))

const setMacros = vi.fn()
const currentMacros: Macro[] = [{ id: 'live', command: '/live', text: 'now' }]
vi.mock('../../../../store/useMacroStore', () => ({
  useMacroStore: { getState: () => ({ macros: currentMacros, setMacros }) },
}))

import { useSyncBackup } from './useSyncBackup'

const manifest = (over: Partial<BackupManifest> = {}): BackupManifest => ({
  slot: 'A',
  rev: 3,
  chunks: 1,
  checksum: 'c',
  count: 2,
  takenAt: '2026-08-01T10:00:00.000Z',
  device: 'this-device',
  ...over,
})
const restored: Macro[] = [{ id: 'old', command: '/old', text: 'then' }]
const event = (dev: string): EditEvent => ({ at: '2026-08-01T10:00:00.000Z', dev, kind: 'update', n: 1 })

beforeEach(() => {
  vi.clearAllMocks()
  backupStatus.mockResolvedValue(null)
  readBackup.mockResolvedValue({ status: 'none' })
  syncUsage.mockResolvedValue({ used: 1024, total: 102_400, fraction: 0.01 })
  readEditLog.mockResolvedValue([])
  takeSnapshot.mockResolvedValue(null)
  writeBackup.mockResolvedValue({ status: 'written', manifest: manifest() })
})

describe('useSyncBackup', () => {
  it('reports the manifest and the quota once loaded', async () => {
    backupStatus.mockResolvedValue(manifest())
    const { result } = renderHook(() => useSyncBackup())
    await waitFor(() => expect(result.current.manifest).not.toBeNull())
    expect(result.current.manifest?.count).toBe(2)
    expect(result.current.usage?.fraction).toBeCloseTo(0.01)
  })

  it('flags the newest change as coming from elsewhere when it did', async () => {
    readEditLog.mockResolvedValue([event('this-device'), event('other-laptop')])
    const { result } = renderHook(() => useSyncBackup())
    await waitFor(() => expect(result.current.fromAnotherDevice).toBe(true))
  })

  it('does not flag it when this device made the newest change', async () => {
    // Only the newest entry counts. "Somebody once edited this elsewhere" is true of nearly any
    // shared library and would leave the warning up permanently.
    readEditLog.mockResolvedValue([event('other-laptop'), event('this-device')])
    const { result } = renderHook(() => useSyncBackup())
    await waitFor(() => expect(result.current.usage).not.toBeNull())
    expect(result.current.fromAnotherDevice).toBe(false)
  })

  describe('backupNow', () => {
    // The automatic path runs in the service worker, where a rejection reaches a console nobody
    // opens. This is the only route by which a failed sync write reaches the person it affects --
    // which is how a backup that had never once succeeded still reported "not backed up yet"
    // without ever explaining itself.
    it('reports what was written', async () => {
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.backupNow()
      })
      expect(result.current.status).toEqual({ ok: true, message: 'settings.cloudBackup.status.backedUp:2' })
    })

    it('says so when there was nothing new to write', async () => {
      writeBackup.mockResolvedValue({ status: 'unchanged' })
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.backupNow()
      })
      expect(result.current.status).toEqual({ ok: true, message: 'settings.cloudBackup.status.upToDate' })
    })

    it('surfaces a library that no longer fits', async () => {
      writeBackup.mockResolvedValue({ status: 'too-large', needed: 51_200 })
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.backupNow()
      })
      expect(result.current.status).toEqual({ ok: false, message: 'settings.cloudBackup.status.tooLarge:50' })
    })

    it('surfaces the thrown message rather than swallowing it', async () => {
      writeBackup.mockRejectedValue(new Error('QUOTA_BYTES quota exceeded'))
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.backupNow()
      })
      expect(result.current.status).toEqual({
        ok: false,
        message: 'settings.cloudBackup.status.failed:QUOTA_BYTES quota exceeded',
      })
    })

    it('does not print [object Object] for a thrown value that is not an Error', async () => {
      // chrome.* rejects with plain objects in places, and String() on one of those produces
      // exactly the uninformative message this path exists to avoid.
      writeBackup.mockRejectedValue({ message: 'odd shape' })
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.backupNow()
      })
      expect(result.current.status?.message).not.toContain('[object Object]')
      expect(result.current.status?.message).toContain('odd shape')
    })
  })

  describe('restore', () => {
    it('snapshots the current library before replacing it', async () => {
      readBackup.mockResolvedValue({ status: 'read', macros: restored, manifest: manifest() })
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.restore()
      })
      // Forced, because whatever is in the library right now is about to go, and whether it
      // happens to match the last snapshot is beside the point.
      expect(takeSnapshot).toHaveBeenCalledWith(currentMacros, { force: true })
      expect(setMacros).toHaveBeenCalledWith(restored)
    })

    it('takes the snapshot before the replacement, not after', async () => {
      const order: string[] = []
      takeSnapshot.mockImplementation(() => {
        order.push('snapshot')
        return Promise.resolve(null)
      })
      setMacros.mockImplementation(() => order.push('replace'))
      readBackup.mockResolvedValue({ status: 'read', macros: restored, manifest: manifest() })
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.restore()
      })
      expect(order).toEqual(['snapshot', 'replace'])
    })

    it.each([
      ['none', 'settings.cloudBackup.status.none'],
      ['incomplete', 'settings.cloudBackup.status.incomplete'],
      ['corrupt', 'settings.cloudBackup.status.corrupt'],
    ])('reports %s distinctly rather than as one generic failure', async (status, key) => {
      // Only one of the three is worth trying again: half-arrived data will finish propagating,
      // whereas absent and mismatched will not. Collapsing them would hide that.
      readBackup.mockResolvedValue({ status } as BackupReadResult)
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.restore()
      })
      expect(result.current.status).toEqual({ ok: false, message: key })
    })

    it('changes nothing at all when the backup could not be read', async () => {
      readBackup.mockResolvedValue({ status: 'corrupt' })
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.restore()
      })
      expect(setMacros).not.toHaveBeenCalled()
      expect(takeSnapshot).not.toHaveBeenCalled()
    })

    it('says how many macros came back', async () => {
      readBackup.mockResolvedValue({ status: 'read', macros: restored, manifest: manifest() })
      const { result } = renderHook(() => useSyncBackup())
      await act(async () => {
        await result.current.restore()
      })
      expect(result.current.status).toEqual({ ok: true, message: 'settings.cloudBackup.status.restored:1' })
    })
  })
})
