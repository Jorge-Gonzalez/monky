// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/preact'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useCoarsePointer } from './useCoarsePointer'

const original = window.matchMedia

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  const mq = {
    matches,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }
  window.matchMedia = vi.fn(() => mq) as unknown as typeof window.matchMedia
  return {
    change(next: boolean) {
      mq.matches = next
      listeners.forEach((fn) => fn())
    },
    get listenerCount() {
      return listeners.size
    },
  }
}

afterEach(() => {
  window.matchMedia = original
})

describe('useCoarsePointer', () => {
  it('reports what the pointer query says', () => {
    stubMatchMedia(true)
    expect(renderHook(() => useCoarsePointer()).result.current).toBe(true)

    stubMatchMedia(false)
    expect(renderHook(() => useCoarsePointer()).result.current).toBe(false)
  })

  it('follows a keyboard being attached or detached mid-session', () => {
    const mq = stubMatchMedia(true)
    const { result } = renderHook(() => useCoarsePointer())
    expect(result.current).toBe(true)

    void act(() => mq.change(false))
    expect(result.current).toBe(false)
  })

  it('stops listening when unmounted', () => {
    const mq = stubMatchMedia(true)
    const { unmount } = renderHook(() => useCoarsePointer())
    expect(mq.listenerCount).toBe(1)
    unmount()
    expect(mq.listenerCount).toBe(0)
  })

  it('reports a fine pointer where matchMedia does not exist', () => {
    // The extension's own pages always have it. A test environment or a non-DOM render does
    // not, and defaulting to coarse there would silently switch every list to toggle-on-click.
    window.matchMedia = undefined as unknown as typeof window.matchMedia
    expect(renderHook(() => useCoarsePointer()).result.current).toBe(false)
  })
})
