// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useScrollIntoView } from './useScrollIntoView';

describe('useScrollIntoView Hook', () => {
  it('should call scrollIntoView on the selected element', () => {
    const container = document.createElement('div');
    const item1 = document.createElement('div');
    const item2 = document.createElement('div');
    item2.className = 'selected';
    item2.scrollIntoView = vi.fn();
    container.appendChild(item1);
    container.appendChild(item2);

    const containerRef = { current: container };

    renderHook(() => useScrollIntoView(containerRef, 1));

    expect(item2.scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });

  it('should not throw if container is not available', () => {
    const containerRef = { current: null };
    const { rerender } = renderHook(() => useScrollIntoView(containerRef, 1));
    expect(() => rerender()).not.toThrow();
  });

  it('should not throw if selected element is not found', () => {
    const container = document.createElement('div');
    const containerRef = { current: container };
    const { rerender } = renderHook(() => useScrollIntoView(containerRef, 1));
    expect(() => rerender()).not.toThrow();
  });

  it('should not throw if scrollIntoView is not a function', () => {
    const container = document.createElement('div');
    const item = document.createElement('div');
    item.className = 'selected';
    (item as any).scrollIntoView = undefined; // Simulate missing function
    container.appendChild(item);
    const containerRef = { current: container };
    const { rerender } = renderHook(() => useScrollIntoView(containerRef, 1));
    expect(() => rerender()).not.toThrow();
  });
});