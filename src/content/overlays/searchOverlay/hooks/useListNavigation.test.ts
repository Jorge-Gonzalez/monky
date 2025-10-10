// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useListNavigation } from './useListNavigation';

describe('useListNavigation Hook', () => {
  it('should initialize with selectedIndex at 0', () => {
    const { result } = renderHook(() => useListNavigation(5));
    expect(result.current.selectedIndex).toBe(0);
  });

  it('should increment selectedIndex on navigateDown', () => {
    const { result } = renderHook(() => useListNavigation(5));

    act(() => {
      result.current.navigateDown();
    });

    expect(result.current.selectedIndex).toBe(1);
  });

  it('should wrap to 0 when navigating down from the last item', () => {
    const { result } = renderHook(() => useListNavigation(3));

    act(() => result.current.navigateDown()); // index 1
    act(() => result.current.navigateDown()); // index 2
    act(() => result.current.navigateDown()); // index 0 (wraps)

    expect(result.current.selectedIndex).toBe(0);
  });

  it('should decrement selectedIndex on navigateUp', () => {
    const { result } = renderHook(() => useListNavigation(5));

    act(() => result.current.navigateDown()); // index 1
    act(() => result.current.navigateUp());   // index 0

    expect(result.current.selectedIndex).toBe(0);
  });

  it('should wrap to the last item when navigating up from the first item', () => {
    const { result } = renderHook(() => useListNavigation(3));

    act(() => {
      result.current.navigateUp();
    });

    expect(result.current.selectedIndex).toBe(2);
  });

  it('should reset selectedIndex to 0', () => {
    const { result } = renderHook(() => useListNavigation(5));

    act(() => result.current.navigateDown());
    act(() => result.current.navigateDown());
    expect(result.current.selectedIndex).toBe(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedIndex).toBe(0);
  });
});