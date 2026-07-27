import { useMacroStore } from '../../store/useMacroStore'
import type { ThemeMode } from '../../types'

export default function ThemeSwitcher() {
  const setTheme = useMacroStore(s => s.setTheme)

  const handleThemeChange = (theme: ThemeMode) => {
    setTheme(theme)
  }

  return (
    <div className="horizontal gap-xs">
      <button
        onClick={() => handleThemeChange('light')}
          className="padding-xs
            tween-opacity-ground-quick
            ground-subtle ink rule corner-md font-sm pressable
            hover:alpha-90"
        aria-label="Set light theme"
        title="Light theme"
      >
        ☀️
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
          className="padding-xs
            tween-opacity-ground-quick
            ground-subtle ink rule corner-md font-sm pressable
            hover:alpha-90"
        aria-label="Set dark theme"
        title="Dark theme"
      >
        🌙
      </button>
      <button onClick={() => handleThemeChange('system')} className="padding-xs
        tween-opacity-ground-quick
        ground-subtle ink rule corner-md font-sm pressable
        hover:alpha-90" aria-label="Set system theme" title="System theme">⚙️</button>
    </div>
  )
}
