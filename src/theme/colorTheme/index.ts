import { ColorTheme } from '../../types'
import { lightThemeColors as humoLight, darkThemeColors as humoDark } from './humo'
import { lightThemeColors as aceraLight, darkThemeColors as aceraDark } from './acera'
import { lightThemeColors as marLight, darkThemeColors as marDark } from './mar'

const themes: Record<ColorTheme, { light: Record<string, string>; dark: Record<string, string> }> = {
  humo:  { light: humoLight,  dark: humoDark  },
  acera: { light: aceraLight, dark: aceraDark },
  mar:   { light: marLight,   dark: marDark   },
}

export function getColorThemeColors(colorTheme: ColorTheme, isDark: boolean): Record<string, string> {
  return isDark ? themes[colorTheme].dark : themes[colorTheme].light
}
