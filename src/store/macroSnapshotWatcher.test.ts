// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Macro } from '../types'
import type * as MacroStorage from '../content/storage/macroStorage'

const takeSnapshot = vi.fn((_macros: Macro[]) => Promise.resolve(null))
const listSnapshots = vi.fn<() => Promise<unknown[]>>(() => Promise.resolve([]))
vi.mock('./macroSnapshots', () => ({
  takeSnapshot: (macros: Macro[]) => takeSnapshot(macros),
  listSnapshots: () => listSnapshots(),
}))

const loadStoredMacros = vi.fn<() => Promise<Macro[] | null>>(() => Promise.resolve(null))
vi.mock('../content/storage/macroStorage', async (importOriginal) => ({
  ...(await importOriginal<typeof MacroStorage>()),
  loadStoredMacros: () => loadStoredMacros(),
}))

import { startMacroSnapshots } from './macroSnapshotWatcher'

const macro = (id: string): Macro => ({ id, command: `/${id}`, text: id, contentType: 'text/plain' })

/** Drives the storage listener the watcher subscribes through. */
let fireChange: ((changes: Record<string, { newValue?: unknown }>, area: string) => void) | null = null

function envelope(macros: Macro[]) {
  return { 'macro-storage': { newValue: JSON.stringify({ state: { macros } }) } }
}

beforeEach(() => {
  vi.useFakeTimers()
  takeSnapshot.mockClear()
  // Reset the implementations too, not just the call records: clearAllMocks leaves a
  // mockResolvedValue in place, so one baseline test would otherwise configure the next.
  listSnapshots.mockReset().mockResolvedValue([])
  loadStoredMacros.mockReset().mockResolvedValue(null)
  fireChange = null
  ;(globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      onChanged: {
        addListener: (fn: typeof fireChange) => {
          fireChange = fn
        },
      },
    },
  }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('startMacroSnapshots — the baseline', () => {
  it('records the library as found when nothing has been recorded yet', async () => {
    // Otherwise the first snapshot is the state *after* the first change, and the first mistake
    // on any install is the one thing not protected.
    const found = [macro('a'), macro('b')]
    listSnapshots.mockResolvedValue([])
    loadStoredMacros.mockResolvedValue(found)

    startMacroSnapshots({ debounceMs: 1000 })
    await vi.waitFor(() => expect(takeSnapshot).toHaveBeenCalledWith(found))
  })

  it('records nothing when snapshots already exist', async () => {
    listSnapshots.mockResolvedValue([{ rev: 1 }])
    loadStoredMacros.mockResolvedValue([macro('a')])

    startMacroSnapshots({ debounceMs: 1000 })
    await vi.waitFor(() => expect(listSnapshots).toHaveBeenCalled())
    expect(takeSnapshot).not.toHaveBeenCalled()
  })

  it('records nothing when storage holds no library to record', async () => {
    listSnapshots.mockResolvedValue([])
    loadStoredMacros.mockResolvedValue(null)

    startMacroSnapshots({ debounceMs: 1000 })
    await vi.waitFor(() => expect(loadStoredMacros).toHaveBeenCalled())
    expect(takeSnapshot).not.toHaveBeenCalled()
  })
})

describe('startMacroSnapshots', () => {
  it('snapshots after the library settles', () => {
    startMacroSnapshots({ debounceMs: 1000 })
    fireChange!(envelope([macro('a')]), 'local')

    expect(takeSnapshot).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(takeSnapshot).toHaveBeenCalledTimes(1)
    expect(takeSnapshot).toHaveBeenCalledWith([macro('a')])
  })

  it('snapshots every field the macro was stored with, not just the ones expansion needs', () => {
    // Found in a real browser, not here: the watcher used to read through the detector's view,
    // which narrows to the six fields expansion cares about and silently dropped `updated_at` --
    // the field the backend merge orders by. Every fixture in this file happened to carry only
    // those six, so nothing noticed. A backup that reshapes what it stores cannot restore what
    // it was given.
    startMacroSnapshots({ debounceMs: 1000 })
    const stored = {
      ...macro('a'),
      updated_at: '2026-07-31T06:25:07.947Z',
      is_sensitive: false,
    }
    fireChange!({ 'macro-storage': { newValue: JSON.stringify({ state: { macros: [stored] } }) } }, 'local')
    vi.advanceTimersByTime(1000)

    expect(takeSnapshot).toHaveBeenCalledWith([stored])
  })

  it('coalesces a burst into one snapshot of the final state', () => {
    // An import adds macros one at a time. Without this, a single import would spend all five
    // recent retention slots on intermediate states of itself.
    startMacroSnapshots({ debounceMs: 1000 })
    fireChange!(envelope([macro('a')]), 'local')
    vi.advanceTimersByTime(400)
    fireChange!(envelope([macro('a'), macro('b')]), 'local')
    vi.advanceTimersByTime(400)
    fireChange!(envelope([macro('a'), macro('b'), macro('c')]), 'local')

    vi.advanceTimersByTime(1000)
    expect(takeSnapshot).toHaveBeenCalledTimes(1)
    expect(takeSnapshot).toHaveBeenCalledWith([macro('a'), macro('b'), macro('c')])
  })

  it('snapshots again for a change that arrives after the first settled', () => {
    startMacroSnapshots({ debounceMs: 1000 })
    fireChange!(envelope([macro('a')]), 'local')
    vi.advanceTimersByTime(1000)
    fireChange!(envelope([macro('b')]), 'local')
    vi.advanceTimersByTime(1000)

    expect(takeSnapshot).toHaveBeenCalledTimes(2)
    expect(takeSnapshot).toHaveBeenLastCalledWith([macro('b')])
  })

  it('ignores a stored value that is not a macro list', () => {
    // Corrupt or half-written storage must not become a snapshot of nothing, which would spend a
    // retention slot recording the corruption.
    startMacroSnapshots({ debounceMs: 1000 })
    fireChange!({ 'macro-storage': { newValue: JSON.stringify({ state: { macros: 'broken' } }) } }, 'local')
    vi.advanceTimersByTime(1000)
    expect(takeSnapshot).not.toHaveBeenCalled()
  })

  it('ignores changes in the sync area', () => {
    startMacroSnapshots({ debounceMs: 1000 })
    fireChange!(envelope([macro('a')]), 'sync')
    vi.advanceTimersByTime(1000)
    expect(takeSnapshot).not.toHaveBeenCalled()
  })

  it('stops when told to, without firing a snapshot already scheduled', () => {
    const stop = startMacroSnapshots({ debounceMs: 1000 })
    fireChange!(envelope([macro('a')]), 'local')
    stop()
    vi.advanceTimersByTime(5000)
    expect(takeSnapshot).not.toHaveBeenCalled()
  })

  it('survives a snapshot that fails, because the library is already stored', () => {
    takeSnapshot.mockReturnValueOnce(Promise.reject(new Error('quota')))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    startMacroSnapshots({ debounceMs: 1000 })

    expect(() => {
      fireChange!(envelope([macro('a')]), 'local')
      vi.advanceTimersByTime(1000)
    }).not.toThrow()
    warn.mockRestore()
  })
})
