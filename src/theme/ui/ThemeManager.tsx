import { useEffect } from 'react';
import { useMacroStore } from '../../store/useMacroStore';
import { ThemeMode } from '../../types';

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
    }

    applyTheme(theme);

    const handleChange = (e: MediaQueryListEvent) => {
      // Only re-apply if the theme is 'system'
      if (theme === 'system') applyTheme('system');
    };

    MQL.addEventListener('change', handleChange);
    return () => MQL.removeEventListener('change', handleChange);
  }, [theme]);

  return null;
}