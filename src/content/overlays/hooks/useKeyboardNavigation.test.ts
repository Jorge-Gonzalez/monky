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

const handlers = (axis: 'vertical' | 'horizontal') => ({
  isActive: true,
  axis,
  onSelect: vi.fn(),
  onClose: vi.fn(),
  onNavigatePrev: vi.fn(),
  onNavigateNext: vi.fn(),
})

describe('useKeyboardNavigation', () => {
  let h: ReturnType<typeof handlers>
  beforeEach(() => { h = handlers('horizontal') })

  it('Escape closes the overlay and consumes the key', () => {
    renderHook(() => useKeyboardNavigation(h))
    expect(press('Escape').defaultPrevented).toBe(true)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('Enter selects the focused item', () => {
    renderHook(() => useKeyboardNavigation(h))
    expect(press('Enter').defaultPrevented).toBe(true)
    expect(h.onSelect).toHaveBeenCalledTimes(1)
  })

  it('horizontal: ArrowRight and ArrowLeft drive navigation', () => {
    renderHook(() => useKeyboardNavigation(h))
    expect(press('ArrowRight').defaultPrevented).toBe(true)
    expect(press('ArrowLeft').defaultPrevented).toBe(true)
    expect(h.onNavigateNext).toHaveBeenCalledTimes(1)
    expect(h.onNavigatePrev).toHaveBeenCalledTimes(1)
  })

  it('vertical: ArrowDown and ArrowUp drive navigation; left/right are left alone', () => {
    const v = handlers('vertical')
    renderHook(() => useKeyboardNavigation(v))
    expect(press('ArrowDown').defaultPrevented).toBe(true)
    expect(press('ArrowUp').defaultPrevented).toBe(true)
    expect(v.onNavigateNext).toHaveBeenCalledTimes(1)
    expect(v.onNavigatePrev).toHaveBeenCalledTimes(1)
    expect(press('ArrowRight').defaultPrevented).toBe(false)
    expect(v.onNavigateNext).toHaveBeenCalledTimes(1)
  })

  it("Tab 'cycle': Tab moves next and Shift+Tab moves prev", () => {
    renderHook(() => useKeyboardNavigation({ ...h, onTab: 'cycle' }))
    expect(press('Tab').defaultPrevented).toBe(true)
    expect(h.onNavigateNext).toHaveBeenCalledTimes(1)
    press('Tab', { shiftKey: true })
    expect(h.onNavigatePrev).toHaveBeenCalledTimes(1)
  })

  it('Tab callback: runs the action and consumes the key', () => {
    const onTab = vi.fn()
    renderHook(() => useKeyboardNavigation({ ...h, onTab }))
    expect(press('Tab').defaultPrevented).toBe(true)
    expect(onTab).toHaveBeenCalledTimes(1)
    expect(h.onNavigateNext).not.toHaveBeenCalled()
  })

  it('leaves Tab untouched when onTab is omitted (lets the page handle it)', () => {
    renderHook(() => useKeyboardNavigation(h))
    const e = press('Tab')
    expect(e.defaultPrevented).toBe(false)
    expect(h.onNavigateNext).not.toHaveBeenCalled()
  })

  it('does nothing while inactive', () => {
    renderHook(() => useKeyboardNavigation({ ...h, isActive: false }))
    press('Enter'); press('Escape'); press('ArrowRight')
    expect(h.onSelect).not.toHaveBeenCalled()
    expect(h.onClose).not.toHaveBeenCalled()
    expect(h.onNavigateNext).not.toHaveBeenCalled()
  })

  it('detaches its listener on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardNavigation(h))
    unmount()
    press('Enter')
    expect(h.onSelect).not.toHaveBeenCalled()
  })
})
