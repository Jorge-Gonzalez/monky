// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardNavigation } from './useKeyboardNavigation';

describe('useKeyboardNavigation Hook', () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const onNavigateUp = vi.fn();
  const onNavigateDown = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isActive: true,
    itemCount: 5,
    selectedIndex: 2,
    onSelect,
    onClose,
    onNavigateUp,
    onNavigateDown,
  };

  it('should call onNavigateDown on "ArrowDown" key press', () => {
    renderHook(() => useKeyboardNavigation(defaultProps));
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(onNavigateDown).toHaveBeenCalledTimes(1);
    expect(onNavigateUp).not.toHaveBeenCalled();
  });

  it('should call onNavigateUp on "ArrowUp" key press', () => {
    renderHook(() => useKeyboardNavigation(defaultProps));
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    expect(onNavigateUp).toHaveBeenCalledTimes(1);
    expect(onNavigateDown).not.toHaveBeenCalled();
  });

  it('should call onSelect on "Enter" key press', () => {
    renderHook(() => useKeyboardNavigation(defaultProps));
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onClose on "Escape" key press', () => {
    renderHook(() => useKeyboardNavigation(defaultProps));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call any handlers if isActive is false', () => {
    renderHook(() => useKeyboardNavigation({ ...defaultProps, isActive: false }));
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onNavigateDown).not.toHaveBeenCalled();
    expect(onNavigateUp).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should clean up event listener on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardNavigation(defaultProps));

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
  });

  it('should not call handlers for other keys', () => {
    renderHook(() => useKeyboardNavigation(defaultProps));
    fireEvent.keyDown(document, { key: 'a' });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(onNavigateDown).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});