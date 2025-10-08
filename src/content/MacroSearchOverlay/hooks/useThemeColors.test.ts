// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useThemeColors } from './useThemeColors';
import { lightThemeColors, darkThemeColors } from '../../../content/theme';
import * as themeUtils from '../../../lib/themeUtils';

describe('useThemeColors Hook', () => {
  it('should apply light theme colors and class when theme is "light"', () => {
    const element = document.createElement('div');
    const elementRef = { current: element };

    renderHook(() => useThemeColors(elementRef, 'light', true));

    expect(element.classList.contains('light')).toBe(true);
    expect(element.classList.contains('dark')).toBe(false);
    expect(element.style.getPropertyValue('--bg-primary')).toBe(lightThemeColors['--bg-primary']);
  });

  it('should apply dark theme colors and class when theme is "dark"', () => {
    const element = document.createElement('div');
    const elementRef = { current: element };

    renderHook(() => useThemeColors(elementRef, 'dark', true));

    expect(element.classList.contains('dark')).toBe(true);
    expect(element.classList.contains('light')).toBe(false);
    expect(element.style.getPropertyValue('--bg-primary')).toBe(darkThemeColors['--bg-primary']);
  });

  it('should use system preference for "system" theme (mocked as light)', () => {
    vi.spyOn(themeUtils, 'isDarkTheme').mockReturnValue(false);
    const element = document.createElement('div');
    const elementRef = { current: element };

    renderHook(() => useThemeColors(elementRef, 'system', true));

    expect(element.classList.contains('light')).toBe(true);
    expect(element.style.getPropertyValue('--bg-primary')).toBe(lightThemeColors['--bg-primary']);
  });

  it('should use system preference for "system" theme (mocked as dark)', () => {
    vi.spyOn(themeUtils, 'isDarkTheme').mockReturnValue(true);
    const element = document.createElement('div');
    const elementRef = { current: element };

    renderHook(() => useThemeColors(elementRef, 'system', true));

    expect(element.classList.contains('dark')).toBe(true);
    expect(element.style.getPropertyValue('--bg-primary')).toBe(darkThemeColors['--bg-primary']);
  });

  it('should not apply styles if isActive is false', () => {
    const element = document.createElement('div');
    const elementRef = { current: element };

    renderHook(() => useThemeColors(elementRef, 'dark', false));

    expect(element.classList.contains('dark')).toBe(false);
    expect(element.style.getPropertyValue('--bg-primary')).toBe('');
  });
});