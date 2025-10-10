import { ThemeMode } from '../types';

/**
 * Determines if dark mode should be applied based on the theme mode
 */
export function isDarkTheme(theme: ThemeMode): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  // For 'system', check the media query
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}