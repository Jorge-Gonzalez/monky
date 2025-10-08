// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutoFocus } from './useAutoFocus';

describe('useAutoFocus Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should focus the input element when isActive becomes true', () => {
    const input = document.createElement('input');
    const focusSpy = vi.spyOn(input, 'focus');
    const inputRef = { current: input };

    renderHook(() => useAutoFocus(inputRef, true, 50));

    // Initially, focus is not called
    expect(focusSpy).not.toHaveBeenCalled();

    // Advance timers to trigger the focus
    vi.advanceTimersByTime(50);

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('should not focus the input element if isActive is false', () => {
    const input = document.createElement('input');
    const focusSpy = vi.spyOn(input, 'focus');
    const inputRef = { current: input };

    renderHook(() => useAutoFocus(inputRef, false));

    vi.runAllTimers();
    expect(focusSpy).not.toHaveBeenCalled();
  });
});