// @vitest-environment jsdom
import { renderHook } from '@testing-library/preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardNavigation } from './useKeyboardNavigation';

function dispatch(key: string, opts?: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  document.dispatchEvent(event);
  return event;
}

function baseOptions(overrides = {}) {
  return {
    isActive: true,
    itemCount: 3,
    selectedIndex: 0,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    onNavigateUp: vi.fn(),
    onNavigateDown: vi.fn(),
    ...overrides,
  };
}

describe('useKeyboardNavigation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls onNavigateDown on ArrowDown', () => {
    const opts = baseOptions();
    renderHook(() => useKeyboardNavigation(opts));
    dispatch('ArrowDown');
    expect(opts.onNavigateDown).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigateUp on ArrowUp', () => {
    const opts = baseOptions();
    renderHook(() => useKeyboardNavigation(opts));
    dispatch('ArrowUp');
    expect(opts.onNavigateUp).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect on Enter', () => {
    const opts = baseOptions();
    renderHook(() => useKeyboardNavigation(opts));
    dispatch('Enter');
    expect(opts.onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape', () => {
    const opts = baseOptions();
    renderHook(() => useKeyboardNavigation(opts));
    dispatch('Escape');
    expect(opts.onClose).toHaveBeenCalledTimes(1);
  });

  it('does nothing when isActive is false', () => {
    const opts = baseOptions({ isActive: false });
    renderHook(() => useKeyboardNavigation(opts));
    dispatch('ArrowDown');
    dispatch('Enter');
    dispatch('Escape');
    expect(opts.onNavigateDown).not.toHaveBeenCalled();
    expect(opts.onSelect).not.toHaveBeenCalled();
    expect(opts.onClose).not.toHaveBeenCalled();
  });

  describe('Tab / onEdit', () => {
    it('calls onEdit and prevents default when onEdit is provided and selectedIndex >= 0', () => {
      const onEdit = vi.fn();
      renderHook(() => useKeyboardNavigation(baseOptions({ onEdit, selectedIndex: 0 })));
      const event = dispatch('Tab');
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('does not call onEdit and does not prevent default when selectedIndex is -1', () => {
      const onEdit = vi.fn();
      renderHook(() => useKeyboardNavigation(baseOptions({ onEdit, selectedIndex: -1 })));
      const event = dispatch('Tab');
      expect(onEdit).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it('does not prevent default when onEdit is not provided', () => {
      renderHook(() => useKeyboardNavigation(baseOptions({ onEdit: undefined, selectedIndex: 2 })));
      const event = dispatch('Tab');
      expect(event.defaultPrevented).toBe(false);
    });
  });
});
