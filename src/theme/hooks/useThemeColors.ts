import { useEffect } from 'react';
import { ThemeMode, ColorTheme } from '../../types';
import { getColorThemeColors } from '../colorTheme';

function isSystemDark(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useThemeColors(
  ref: React.RefObject<HTMLElement | null>,
  theme: ThemeMode,
  isEnabled: boolean,
  colorTheme: ColorTheme = 'humo'
) {
  useEffect(() => {
    if (!isEnabled || !ref.current) return;

    const element = ref.current;
    const isDark = theme === 'dark' || (theme === 'system' && isSystemDark());
    const colors = getColorThemeColors(colorTheme, isDark);

    for (const [property, value] of Object.entries(colors)) {
      element.style.setProperty(property, value);
    }
    element.classList.toggle('dark', isDark);
    element.classList.toggle('light', !isDark);
  }, [ref, theme, isEnabled, colorTheme]);
}
