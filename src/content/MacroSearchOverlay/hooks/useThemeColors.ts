import { useEffect } from 'react';
import { isDarkTheme } from '../../../lib/themeUtils';
import { lightThemeColors, darkThemeColors } from '../../../content/theme';
import { ThemeMode } from '../../../types';

function applyColors(element: HTMLElement, colors: Record<string, string>) {
  for (const key of Object.keys(colors)) {
    element.style.setProperty(key, colors[key]);
  }
}

export function useThemeColors(elementRef: React.RefObject<HTMLElement>, theme: ThemeMode, isActive: boolean) {
  useEffect(() => {
    if (!elementRef.current || !isActive) return;

    const element = elementRef.current;
    const isDark = isDarkTheme(theme);
    const colors = isDark ? darkThemeColors : lightThemeColors;

    applyColors(element, colors);
    element.classList.toggle('dark', isDark);
    element.classList.toggle('light', !isDark);
  }, [elementRef, theme, isActive]);
}