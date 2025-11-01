import { useEffect } from 'react';
import { useMacroStore } from '../../store/useMacroStore';
import { ThemeMode } from '../../types';
import { lightThemeColors, darkThemeColors } from '../theme';

const MQL = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * A headless component that manages the application's theme (light/dark/system).
 * It listens to the theme from the store and system preferences.
 * It should be rendered once at the root of the application.
 */
export function ThemeManager() {
  const theme = useMacroStore(s => s.config.theme);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    function applyTheme(newTheme: ThemeMode) {
      const isDark = newTheme === 'dark' || (newTheme === 'system' && MQL.matches);
      htmlElement.classList.toggle('dark', isDark);
      bodyElement.classList.toggle('dark', isDark);

      // Apply CSS variables to the document root
      const themeColors = isDark ? darkThemeColors : lightThemeColors;
      Object.entries(themeColors).forEach(([key, value]) => {
        htmlElement.style.setProperty(key, value);
      });
    }

    applyTheme(theme);

    const handleChange = () => {
      // Only re-apply if the theme is 'system'
      if (theme === 'system') applyTheme('system');
    };

    MQL.addEventListener('change', handleChange);
    return () => MQL.removeEventListener('change', handleChange);
  }, [theme]);

  return null;
}