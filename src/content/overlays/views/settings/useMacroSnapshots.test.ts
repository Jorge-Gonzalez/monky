// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../../../../types'
import type { SnapshotMeta } from '../../../../store/macroSnapshots'

vi.mock('../../../../lib/i18n', () => ({
  t: (key: string, opts?: Record<string, string>) => (opts ? `${key}:${Object.values(opts).join(',')}` : key),
}))

const listSnapshots = vi.fn<() => Promise<SnapshotMeta[]>>(() => Promise.resolve([]))
const readSnapshot = vi.fn<(rev: number) => Promise<Macro[] | null>>(() => Promise.resolve(null))
const takeSnapshot = vi.fn<(macros: Macro[], opts?: { force?: boolean }) => Promise<SnapshotMeta | null>>(
  () => Promise.resolve(null)
)
vi.mock('../../../../store/macroSnapshots', () => ({
  listSnapshots: () => listSnapshots(),
  readSnapshot: (rev: number) => readSnapshot(rev),
  takeSnapshot: (macros: Macro[], opts?: { force?: boolean }) => takeSnapshot(macros, opts),
}))

const setMacros = vi.fn()
const currentMacros: Macro[] = [{ id: 'live', command: '/live', text: 'now', contentType: 'text/plain' }]
vi.mock('../../../../store/useMacroStore', () => ({
  useMacroStore: { getState: () => ({ macros: currentMacros, setMacros }) },
}))

import { useMacroSnapshots } from './useMacroSnapshots'

const meta = (rev: number): SnapshotMeta => ({
  rev,
  takenAt: new Date().toISOString(),
  checksum: `c${rev}`,
  count: 1,
})
const backup: Macro[] = [{ id: 'old', command: '/old', text: 'then', contentType: 'text/plain' }]

beforeEach(() => {
  vi.clearAllMocks()
  listSnapshots.mockResolvedValue([])
  readSnapshot.mockResolvedValue(null)
  takeSnapshot.mockResolvedValue(null)
})

describe('useMacroSnapshots', () => {
  it('lists what is stored on mount', async () => {
    listSnapshots.mockResolvedValue([meta(2), meta(1)])
    const { result } = renderHook(() => useMacroSnapshots())
    await waitFor(() => expect(result.current.snapshots).toHaveLength(2))
  })

  it('snapshots the live library before replacing it', async () => {
    listSnapshots.mockResolvedValue([meta(1)])
    readSnapshot.mockResolvedValue(backup)
    const { result } = renderHook(() => useMacroSnapshots())
    await waitFor(() => expect(result.current.snapshots).toHaveLength(1))

    await act(() => result.current.restore(1))

    // Forced, and before the replacement: this is the write that makes saying yes recoverable.
    expect(takeSnapshot).toHaveBeenCalledWith(currentMacros, { force: true })
    expect(takeSnapshot.mock.invocationCallOrder[0]).toBeLessThan(setMacros.mock.invocationCallOrder[0])
    expect(setMacros).toHaveBeenCalledWith(backup)
  })

  it('reports what it restored', async () => {
    readSnapshot.mockResolvedValue(backup)
    const { result } = renderHook(() => useMacroSnapshots())
    await act(() => result.current.restore(1))
    expect(result.current.status).toEqual({ ok: true, message: 'settings.snapshots.status.restored:1' })
  })

  it('changes nothing when the payload is missing', async () => {
    // The index and the payloads disagreeing must not turn into an empty library, which is the
    // one outcome worse than not restoring at all.
    readSnapshot.mockResolvedValue(null)
    const { result } = renderHook(() => useMacroSnapshots())
    await act(() => result.current.restore(9))

    expect(setMacros).not.toHaveBeenCalled()
    expect(takeSnapshot).not.toHaveBeenCalled()
    expect(result.current.status).toEqual({ ok: false, message: 'settings.snapshots.status.unreadable' })
  })

  it('re-reads the list after a restore, so the new backup appears', async () => {
    readSnapshot.mockResolvedValue(backup)
    const { result } = renderHook(() => useMacroSnapshots())
    await waitFor(() => expect(listSnapshots).toHaveBeenCalledTimes(1))
    await act(() => result.current.restore(1))
    expect(listSnapshots).toHaveBeenCalledTimes(2)
  })
})
