import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

const MQL = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * A simple, self-contained hook for managing theme state for comparison.
 * It uses localStorage for persistence and does not depend on Zustand.
 *
 * @returns A tuple containing the current theme and a function to update it.
 */
export function useSimpleTheme(): [ThemeMode, (theme: ThemeMode) => void] {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Get theme from localStorage or default to 'system'
    const storedTheme = localStorage.getItem('simple-theme');
    return (storedTheme as ThemeMode) || 'system';
  });

  // Function to apply the theme class to the document
  const applyTheme = useCallback((themeToApply: ThemeMode) => {
    const isDark =
      themeToApply === 'dark' || (themeToApply === 'system' && MQL.matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
  }, []);

  // Effect to apply theme and listen for system changes
  useEffect(() => {
    applyTheme(theme);

    const handleSystemThemeChange = () => {
      // Only re-apply if the current theme is 'system'
      if (localStorage.getItem('simple-theme') === 'system' || !localStorage.getItem('simple-theme')) {
        applyTheme('system');
      }
    };

    MQL.addEventListener('change', handleSystemThemeChange);
    return () => MQL.removeEventListener('change', handleSystemThemeChange);
  }, [theme, applyTheme]);

  // Function to update theme state and localStorage
  const updateTheme = (newTheme: ThemeMode) => {
    localStorage.setItem('simple-theme', newTheme);
    setTheme(newTheme);
  };

  return [theme, updateTheme];
}