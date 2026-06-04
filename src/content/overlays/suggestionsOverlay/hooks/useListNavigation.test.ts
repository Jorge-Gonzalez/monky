// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/preact'
import { describe, it, expect } from 'vitest'
import { useListNavigation } from './useListNavigation'

describe('useListNavigation', () => {
  it('starts on the first item', () => {
    const { result } = renderHook(() => useListNavigation(3))
    expect(result.current.selectedIndex).toBe(0)
  })

  it('moves right and wraps to the start past the last item', () => {
    const { result } = renderHook(() => useListNavigation(3))
    act(() => result.current.navigateRight())
    expect(result.current.selectedIndex).toBe(1)
    act(() => result.current.navigateRight())
    expect(result.current.selectedIndex).toBe(2)
    act(() => result.current.navigateRight()) // past the end → wrap
    expect(result.current.selectedIndex).toBe(0)
  })

  it('moves left and wraps to the last item from the start', () => {
    const { result } = renderHook(() => useListNavigation(3))
    act(() => result.current.navigateLeft()) // from 0 → wrap to last
    expect(result.current.selectedIndex).toBe(2)
    act(() => result.current.navigateLeft())
    expect(result.current.selectedIndex).toBe(1)
  })

  it('ignores navigation when the list is empty', () => {
    const { result } = renderHook(() => useListNavigation(0))
    act(() => result.current.navigateRight())
    act(() => result.current.navigateLeft())
    expect(result.current.selectedIndex).toBe(0)
  })

  it('reset returns to the first item', () => {
    const { result } = renderHook(() => useListNavigation(3))
    act(() => result.current.navigateRight())
    act(() => result.current.reset())
    expect(result.current.selectedIndex).toBe(0)
  })

  it('clamps the selection when the list shrinks below the current index', () => {
    const { result, rerender } = renderHook(({ n }) => useListNavigation(n), {
      initialProps: { n: 3 },
    })
    act(() => result.current.navigateRight())
    act(() => result.current.navigateRight()) // index 2
    expect(result.current.selectedIndex).toBe(2)
    rerender({ n: 1 }) // only index 0 remains → clamp
    expect(result.current.selectedIndex).toBe(0)
  })

  it('resets to the start when the list becomes empty', () => {
    const { result, rerender } = renderHook(({ n }) => useListNavigation(n), {
      initialProps: { n: 3 },
    })
    act(() => result.current.navigateRight())
    expect(result.current.selectedIndex).toBe(1)
    rerender({ n: 0 })
    expect(result.current.selectedIndex).toBe(0)
  })
})
