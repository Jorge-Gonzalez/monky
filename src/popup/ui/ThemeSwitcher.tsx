import React from 'react';
import { usePopupManager } from '../managers/usePopupManager';
import { ThemeMode } from '../../types';

export default function ThemeSwitcher() {
  const manager = usePopupManager();

  const handleThemeChange = (theme: ThemeMode) => {
    manager.setTheme(theme);
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handleThemeChange('light')}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Set light theme"
        title="Light theme"
      >
        ☀️
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Set dark theme"
        title="Dark theme"
      >
        🌙
      </button>
      <button onClick={() => handleThemeChange('system')} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Set system theme" title="System theme">⚙️</button>
    </div>
  );
}