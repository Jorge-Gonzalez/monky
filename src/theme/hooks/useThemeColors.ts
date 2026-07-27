import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { ThemeMode, ColorTheme } from '../../types'
import { themeSocketVars } from '../socketPalette'

function isSystemDark(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useThemeColors(
  ref: RefObject<HTMLElement | null>,
  theme: ThemeMode,
  isEnabled: boolean,
  colorTheme: ColorTheme = 'humo'
) {
  useEffect(() => {
    if (!isEnabled || !ref.current) return

    const element = ref.current
    const isDark = theme === 'dark' || (theme === 'system' && isSystemDark())
    const colors = themeSocketVars(colorTheme, isDark)

    for (const [property, value] of Object.entries(colors)) {
      element.style.setProperty(property, value)
    }
    element.classList.toggle('dark', isDark)
    element.classList.toggle('light', !isDark)
  }, [ref, theme, isEnabled, colorTheme])
}
