import { ColorTheme } from '../../types'
import { lightThemeColors as humoLight, darkThemeColors as humoDark } from './humo'
import { lightThemeColors as aceraLight, darkThemeColors as aceraDark } from './acera'
import { lightThemeColors as marLight, darkThemeColors as marDark } from './mar'

const themes: Record<ColorTheme, { light: Record<string, string>; dark: Record<string, string> }> = {
  humo:  { light: humoLight,  dark: humoDark  },
  acera: { light: aceraLight, dark: aceraDark },
  mar:   { light: marLight,   dark: marDark   },
}

const statusAliases = {
  '--status-error':        'var(--charged)',
  '--status-warning':      'var(--active)',
  '--status-success':      'var(--calm)',
  '--status-info':         'var(--still)',
  '--status-error-wash':   'var(--charged-wash)',
  '--status-warning-wash': 'var(--active-wash)',
  '--status-success-wash': 'var(--calm-wash)',
  '--status-info-wash':    'var(--still-wash)',
} as const

export function getColorThemeColors(colorTheme: ColorTheme, isDark: boolean): Record<string, string> {
  const base = isDark ? themes[colorTheme].dark : themes[colorTheme].light
  return { ...base, ...statusAliases }
}
