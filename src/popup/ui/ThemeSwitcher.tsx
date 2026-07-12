import { useMacroStore } from '../../store/useMacroStore';
import { ThemeMode } from '../../types';

export default function ThemeSwitcher() {
  const setTheme = useMacroStore(s => s.setTheme);

  const handleThemeChange = (theme: ThemeMode) => {
    setTheme(theme);
  };

  return (
    <div className="horizontal gap-tight">
      <button
        onClick={() => handleThemeChange('light')}
        className="popup-icon-button pressable padding-tight ground-subtle ink rule corner-md font-sm"
        aria-label="Set light theme"
        title="Light theme"
      >
        ☀️
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className="popup-icon-button pressable padding-tight ground-subtle ink rule corner-md font-sm"
        aria-label="Set dark theme"
        title="Dark theme"
      >
        🌙
      </button>
      <button onClick={() => handleThemeChange('system')} className="popup-icon-button pressable padding-tight ground-subtle ink rule corner-md font-sm" aria-label="Set system theme" title="System theme">⚙️</button>
    </div>
  );
}
