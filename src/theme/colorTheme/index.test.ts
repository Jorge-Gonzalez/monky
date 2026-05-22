import { describe, it, expect } from 'vitest'
import { getColorThemeColors } from './index'
import { lightThemeColors as humoLight, darkThemeColors as humoDark } from './humo'
import { lightThemeColors as aceraLight, darkThemeColors as aceraDark } from './acera'
import { lightThemeColors as marLight, darkThemeColors as marDark } from './mar'

describe('getColorThemeColors', () => {
  it('returns humo light palette for humo + light', () => {
    expect(getColorThemeColors('humo', false)).toEqual(humoLight)
  })

  it('returns humo dark palette for humo + dark', () => {
    expect(getColorThemeColors('humo', true)).toEqual(humoDark)
  })

  it('returns acera light palette for acera + light', () => {
    expect(getColorThemeColors('acera', false)).toEqual(aceraLight)
  })

  it('returns acera dark palette for acera + dark', () => {
    expect(getColorThemeColors('acera', true)).toEqual(aceraDark)
  })

  it('returns mar light palette for mar + light', () => {
    expect(getColorThemeColors('mar', false)).toEqual(marLight)
  })

  it('returns mar dark palette for mar + dark', () => {
    expect(getColorThemeColors('mar', true)).toEqual(marDark)
  })

  it('each theme has distinct accent colors in light mode', () => {
    const humoAccent  = getColorThemeColors('humo',  false)['--accent']
    const aceraAccent = getColorThemeColors('acera', false)['--accent']
    const marAccent   = getColorThemeColors('mar',   false)['--accent']
    expect(humoAccent).not.toBe(aceraAccent)
    expect(humoAccent).not.toBe(marAccent)
    expect(aceraAccent).not.toBe(marAccent)
  })

  it('every palette includes the required semantic color variables', () => {
    const required = ['--base-tone', '--ink', '--accent', '--charged', '--active', '--calm', '--still']
    for (const colorTheme of ['humo', 'acera', 'mar'] as const) {
      for (const isDark of [false, true]) {
        const palette = getColorThemeColors(colorTheme, isDark)
        for (const variable of required) {
          expect(palette[variable], `${colorTheme} ${isDark ? 'dark' : 'light'} missing ${variable}`).toBeDefined()
        }
      }
    }
  })
})
