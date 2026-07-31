// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Macro } from '../types'

const takeSnapshot = vi.fn((_macros: Macro[]) => Promise.resolve(null))
vi.mock('./macroSnapshots', () => ({ takeSnapshot: (macros: Macro[]) => takeSnapshot(macros) }))

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

describe('startMacroSnapshots', () => {
  it('snapshots after the library settles', () => {
    startMacroSnapshots({ debounceMs: 1000 })
    fireChange!(envelope([macro('a')]), 'local')

    expect(takeSnapshot).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(takeSnapshot).toHaveBeenCalledTimes(1)
    expect(takeSnapshot).toHaveBeenCalledWith([macro('a')])
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
