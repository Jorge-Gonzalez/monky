import { useEffect } from 'react';
import { ThemeMode } from '../types';
import { lightThemeColors, darkThemeColors } from '../lib/theme';

function applyThemeStyles(element: HTMLElement, colors: Record<string, string>) {
  for (const [property, value] of Object.entries(colors)) {
    element.style.setProperty(property, value);
  }
}

function isSystemDark(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useThemeColors(
  ref: React.RefObject<HTMLElement>,
  theme: ThemeMode,
  isEnabled: boolean
) {
  useEffect(() => {
    if (!ref.current || !isEnabled) return;

    const isDark = theme === 'dark' || (theme === 'system' && isSystemDark());
    
    const themeColors = isDark ? darkThemeColors : lightThemeColors;
    applyThemeStyles(ref.current, themeColors);
    ref.current.classList.toggle('dark', isDark);
  }, [ref, theme, isEnabled]);
}