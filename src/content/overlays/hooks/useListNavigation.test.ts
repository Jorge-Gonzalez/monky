// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/preact'
import { describe, it, expect } from 'vitest'
import { useListNavigation } from './useListNavigation'

describe('useListNavigation — always-selected (default)', () => {
  it('starts on the first item', () => {
    const { result } = renderHook(() => useListNavigation(3))
    expect(result.current.selectedIndex).toBe(0)
  })

  it('moves next and wraps to the start past the last item', () => {
    const { result } = renderHook(() => useListNavigation(3))
    void act(() => result.current.navigateNext())
    expect(result.current.selectedIndex).toBe(1)
    void act(() => result.current.navigateNext())
    expect(result.current.selectedIndex).toBe(2)
    void act(() => result.current.navigateNext()) // past the end → wrap
    expect(result.current.selectedIndex).toBe(0)
  })

  it('moves prev and wraps to the last item from the start', () => {
    const { result } = renderHook(() => useListNavigation(3))
    void act(() => result.current.navigatePrev()) // from 0 → wrap to last
    expect(result.current.selectedIndex).toBe(2)
    void act(() => result.current.navigatePrev())
    expect(result.current.selectedIndex).toBe(1)
  })

  it('ignores navigation when the list is empty', () => {
    const { result } = renderHook(() => useListNavigation(0))
    void act(() => result.current.navigateNext())
    void act(() => result.current.navigatePrev())
    expect(result.current.selectedIndex).toBe(0)
  })

  it('reset returns to the first item', () => {
    const { result } = renderHook(() => useListNavigation(3))
    void act(() => result.current.navigateNext())
    void act(() => result.current.reset())
    expect(result.current.selectedIndex).toBe(0)
  })

  it('clamps the selection when the list shrinks below the current index', () => {
    const { result, rerender } = renderHook(({ n }) => useListNavigation(n), {
      initialProps: { n: 3 },
    })
    void act(() => result.current.navigateNext())
    void act(() => result.current.navigateNext()) // index 2
    expect(result.current.selectedIndex).toBe(2)
    rerender({ n: 1 }) // only index 0 remains → clamp
    expect(result.current.selectedIndex).toBe(0)
  })

  it('resets to the start when the list becomes empty', () => {
    const { result, rerender } = renderHook(({ n }) => useListNavigation(n), {
      initialProps: { n: 3 },
    })
    void act(() => result.current.navigateNext())
    rerender({ n: 0 })
    expect(result.current.selectedIndex).toBe(0)
  })
})

describe('useListNavigation — allowEmpty', () => {
  const empty = { allowEmpty: true }

  it('starts with no selection even when items are present', () => {
    const { result } = renderHook(() => useListNavigation(5, empty))
    expect(result.current.selectedIndex).toBe(-1)
  })

  it('starts with no selection when item count is zero', () => {
    const { result } = renderHook(() => useListNavigation(0, empty))
    expect(result.current.selectedIndex).toBe(-1)
  })

  it('navigateNext from -1 selects index 0', () => {
    const { result } = renderHook(() => useListNavigation(3, empty))
    void act(() => result.current.navigateNext())
    expect(result.current.selectedIndex).toBe(0)
  })

  it('navigatePrev from -1 selects the last item', () => {
    const { result } = renderHook(() => useListNavigation(3, empty))
    void act(() => result.current.navigatePrev())
    expect(result.current.selectedIndex).toBe(2)
  })

  it('navigation is a no-op when item count is zero', () => {
    const { result } = renderHook(() => useListNavigation(0, empty))
    void act(() => result.current.navigateNext())
    void act(() => result.current.navigatePrev())
    expect(result.current.selectedIndex).toBe(-1)
  })

  it('selectIndex selects a valid index and ignores out-of-bounds or negative ones', () => {
    const { result } = renderHook(() => useListNavigation(3, empty))
    void act(() => result.current.selectIndex(2))
    expect(result.current.selectedIndex).toBe(2)
    void act(() => result.current.selectIndex(5))
    expect(result.current.selectedIndex).toBe(2)
    void act(() => result.current.selectIndex(-1))
    expect(result.current.selectedIndex).toBe(2)
  })

  it('reset clears the selection and does not auto-reselect', () => {
    const { result } = renderHook(() => useListNavigation(5, empty))
    void act(() => result.current.selectIndex(2))
    void act(() => result.current.reset())
    expect(result.current.selectedIndex).toBe(-1)
  })

  it('resets to -1 when item count drops to zero', () => {
    const { result, rerender } = renderHook(({ n }) => useListNavigation(n, empty), {
      initialProps: { n: 3 },
    })
    void act(() => result.current.selectIndex(1))
    rerender({ n: 0 })
    expect(result.current.selectedIndex).toBe(-1)
  })

  it('clamps to the last item when count shrinks below the selection', () => {
    const { result, rerender } = renderHook(({ n }) => useListNavigation(n, empty), {
      initialProps: { n: 5 },
    })
    void act(() => result.current.selectIndex(4))
    rerender({ n: 3 })
    expect(result.current.selectedIndex).toBe(2)
  })

  it('does not auto-select when items appear from an empty list', () => {
    const { result, rerender } = renderHook(({ n }) => useListNavigation(n, empty), {
      initialProps: { n: 0 },
    })
    rerender({ n: 4 })
    expect(result.current.selectedIndex).toBe(-1)
  })
})
