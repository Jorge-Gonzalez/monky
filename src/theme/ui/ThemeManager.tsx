import { useEffect } from 'react'
import { useMacroStore } from '../../store/useMacroStore'
import { ThemeMode } from '../../types'
import { themeSocketVars } from '../socketPalette'

const MQL = window.matchMedia('(prefers-color-scheme: dark)')

/**
 * A headless component that manages the application's theme (light/dark/system).
 * It listens to the theme from the store and system preferences.
 * It should be rendered once at the root of the application.
 */
export function ThemeManager() {
  const theme = useMacroStore(s => s.config.theme)
  const colorTheme = useMacroStore(s => s.config.colorTheme ?? 'humo')

  useEffect(() => {
    const htmlElement = document.documentElement
    const bodyElement = document.body

    function applyTheme(newTheme: ThemeMode) {
      const isDark = newTheme === 'dark' || (newTheme === 'system' && MQL.matches)
      htmlElement.classList.toggle('dark', isDark)
      bodyElement.classList.toggle('dark', isDark)
      bodyElement.classList.add('ground', 'ink')

      const colors = themeSocketVars(colorTheme, isDark)
      Object.entries(colors).forEach(([key, value]) => {
        htmlElement.style.setProperty(key, value)
      })
    }

    applyTheme(theme)

    const handleChange = () => {
      if (theme === 'system') applyTheme('system')
    }

    MQL.addEventListener('change', handleChange)
    return () => MQL.removeEventListener('change', handleChange)
  }, [theme, colorTheme])

  return null
}