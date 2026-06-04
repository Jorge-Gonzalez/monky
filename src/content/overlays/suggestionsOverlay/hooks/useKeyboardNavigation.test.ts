// @vitest-environment jsdom
import { renderHook } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKeyboardNavigation } from './useKeyboardNavigation'

// The hook listens on document (capture phase), so we drive it with real keydown
// events on document and assert the wired callbacks + that the key was consumed.
function press(key: string, opts: KeyboardEventInit = {}) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts })
  document.dispatchEvent(e)
  return e
}

const handlers = () => ({
  isActive: true,
  onSelect: vi.fn(),
  onClose: vi.fn(),
  onNavigateLeft: vi.fn(),
  onNavigateRight: vi.fn(),
})

describe('useKeyboardNavigation', () => {
  let h: ReturnType<typeof handlers>
  beforeEach(() => { h = handlers() })

  it('Escape closes the overlay and consumes the key', () => {
    renderHook(() => useKeyboardNavigation(h))
    expect(press('Escape').defaultPrevented).toBe(true)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('ArrowRight and ArrowLeft drive navigation', () => {
    renderHook(() => useKeyboardNavigation(h))
    expect(press('ArrowRight').defaultPrevented).toBe(true)
    expect(press('ArrowLeft').defaultPrevented).toBe(true)
    expect(h.onNavigateRight).toHaveBeenCalledTimes(1)
    expect(h.onNavigateLeft).toHaveBeenCalledTimes(1)
  })

  it('Enter selects the focused item', () => {
    renderHook(() => useKeyboardNavigation(h))
    expect(press('Enter').defaultPrevented).toBe(true)
    expect(h.onSelect).toHaveBeenCalledTimes(1)
  })

  it('Tab moves right and Shift+Tab moves left when tab handling is enabled', () => {
    renderHook(() => useKeyboardNavigation(h))
    expect(press('Tab').defaultPrevented).toBe(true)
    expect(h.onNavigateRight).toHaveBeenCalledTimes(1)
    press('Tab', { shiftKey: true })
    expect(h.onNavigateLeft).toHaveBeenCalledTimes(1)
  })

  it('leaves Tab untouched when preventTabHandling is set (lets the page handle it)', () => {
    renderHook(() => useKeyboardNavigation({ ...h, preventTabHandling: true }))
    const e = press('Tab')
    expect(e.defaultPrevented).toBe(false)
    expect(h.onNavigateRight).not.toHaveBeenCalled()
  })

  it('does nothing while inactive', () => {
    renderHook(() => useKeyboardNavigation({ ...h, isActive: false }))
    press('Enter'); press('Escape'); press('ArrowRight')
    expect(h.onSelect).not.toHaveBeenCalled()
    expect(h.onClose).not.toHaveBeenCalled()
    expect(h.onNavigateRight).not.toHaveBeenCalled()
  })

  it('detaches its listener on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardNavigation(h))
    unmount()
    press('Enter')
    expect(h.onSelect).not.toHaveBeenCalled()
  })
})
