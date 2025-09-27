import { useEffect } from "react";
import { useMacroStore, type ThemeMode } from "../store/useMacroStore";
 
const MQL = window.matchMedia("(prefers-color-scheme: dark)");

/**
 * This hook manages the application's theme (light/dark/system).
 * It listens to the theme setting in the Zustand store and the OS-level
 * preference, and applies the 'dark' class to the <html> element.
 */
export function useTheme() {
  const theme: ThemeMode = useMacroStore(s => s.config.theme);

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(newTheme: ThemeMode) {
      const isDark = newTheme === 'dark' || (newTheme === 'system' && MQL.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply theme on initial load and when theme setting changes
    applyTheme(theme);

    // Listen for changes in OS-level preference
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    MQL.addEventListener("change", handleChange);
    return () => MQL.removeEventListener("change", handleChange);
  }, [theme]);
}