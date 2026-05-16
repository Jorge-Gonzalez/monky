// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import { useListNavigation } from './useListNavigation';

describe('useListNavigation — initial state', () => {
  it('starts with no selection even when items are present', () => {
    const { result } = renderHook(() => useListNavigation(5));
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('starts with no selection when item count is zero', () => {
    const { result } = renderHook(() => useListNavigation(0));
    expect(result.current.selectedIndex).toBe(-1);
  });
});

describe('useListNavigation — navigation', () => {
  it('navigateDown from -1 selects index 0', () => {
    const { result } = renderHook(() => useListNavigation(3));
    act(() => result.current.navigateDown());
    expect(result.current.selectedIndex).toBe(0);
  });

  it('navigateDown advances through the list', () => {
    const { result } = renderHook(() => useListNavigation(3));
    act(() => result.current.navigateDown());
    act(() => result.current.navigateDown());
    expect(result.current.selectedIndex).toBe(1);
  });

  it('navigateDown wraps from last to first', () => {
    const { result } = renderHook(() => useListNavigation(3));
    act(() => result.current.selectIndex(2));
    act(() => result.current.navigateDown());
    expect(result.current.selectedIndex).toBe(0);
  });

  it('navigateUp from -1 selects the last item', () => {
    const { result } = renderHook(() => useListNavigation(3));
    act(() => result.current.navigateUp());
    expect(result.current.selectedIndex).toBe(2);
  });

  it('navigateUp wraps from first to last', () => {
    const { result } = renderHook(() => useListNavigation(3));
    act(() => result.current.selectIndex(0));
    act(() => result.current.navigateUp());
    expect(result.current.selectedIndex).toBe(2);
  });

  it('navigateDown is a no-op when item count is zero', () => {
    const { result } = renderHook(() => useListNavigation(0));
    act(() => result.current.navigateDown());
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('navigateUp is a no-op when item count is zero', () => {
    const { result } = renderHook(() => useListNavigation(0));
    act(() => result.current.navigateUp());
    expect(result.current.selectedIndex).toBe(-1);
  });
});

describe('useListNavigation — selectIndex', () => {
  it('selects a valid index', () => {
    const { result } = renderHook(() => useListNavigation(5));
    act(() => result.current.selectIndex(3));
    expect(result.current.selectedIndex).toBe(3);
  });

  it('ignores out-of-bounds index', () => {
    const { result } = renderHook(() => useListNavigation(3));
    act(() => result.current.selectIndex(5));
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('ignores negative index', () => {
    const { result } = renderHook(() => useListNavigation(3));
    act(() => result.current.selectIndex(-1));
    expect(result.current.selectedIndex).toBe(-1);
  });
});

describe('useListNavigation — reset', () => {
  it('clears the selection', () => {
    const { result } = renderHook(() => useListNavigation(5));
    act(() => result.current.selectIndex(2));
    act(() => result.current.reset());
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('selection stays cleared after reset — does not auto-reselect', () => {
    const { result } = renderHook(() => useListNavigation(5));
    act(() => result.current.selectIndex(1));
    act(() => result.current.reset());
    // selectedIndex must remain -1; the hook must not auto-advance back to 0
    expect(result.current.selectedIndex).toBe(-1);
  });
});

describe('useListNavigation — item count changes', () => {
  it('resets to -1 when item count drops to zero', () => {
    const { result, rerender } = renderHook(({ count }) => useListNavigation(count), {
      initialProps: { count: 3 },
    });
    act(() => result.current.selectIndex(1));
    rerender({ count: 0 });
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('clamps to last item when count shrinks below selection', () => {
    const { result, rerender } = renderHook(({ count }) => useListNavigation(count), {
      initialProps: { count: 5 },
    });
    act(() => result.current.selectIndex(4));
    rerender({ count: 3 });
    expect(result.current.selectedIndex).toBe(2);
  });

  it('does not auto-select when items appear from an empty list', () => {
    const { result, rerender } = renderHook(({ count }) => useListNavigation(count), {
      initialProps: { count: 0 },
    });
    rerender({ count: 4 });
    expect(result.current.selectedIndex).toBe(-1);
  });
});

describe('useListNavigation — hasValidSelection', () => {
  it('is false when nothing is selected', () => {
    const { result } = renderHook(() => useListNavigation(3));
    expect(result.current.hasValidSelection).toBe(false);
  });

  it('is true after a valid selection', () => {
    const { result } = renderHook(() => useListNavigation(3));
    act(() => result.current.selectIndex(1));
    expect(result.current.hasValidSelection).toBe(true);
  });

  it('is false after reset', () => {
    const { result } = renderHook(() => useListNavigation(3));
    act(() => result.current.selectIndex(1));
    act(() => result.current.reset());
    expect(result.current.hasValidSelection).toBe(false);
  });
});
