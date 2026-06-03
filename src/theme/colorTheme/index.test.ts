import { describe, it, expect } from 'vitest'
import { getColorThemeColors } from './index'
import { lightThemeColors as humoLight, darkThemeColors as humoDark } from './humo'
import { lightThemeColors as aceraLight, darkThemeColors as aceraDark } from './acera'
import { lightThemeColors as marLight, darkThemeColors as marDark } from './mar'

describe('getColorThemeColors', () => {
  it('returns humo light palette for humo + light', () => {
    expect(getColorThemeColors('humo', false)).toMatchObject(humoLight)
  })

  it('returns humo dark palette for humo + dark', () => {
    expect(getColorThemeColors('humo', true)).toMatchObject(humoDark)
  })

  it('returns acera light palette for acera + light', () => {
    expect(getColorThemeColors('acera', false)).toMatchObject(aceraLight)
  })

  it('returns acera dark palette for acera + dark', () => {
    expect(getColorThemeColors('acera', true)).toMatchObject(aceraDark)
  })

  it('returns mar light palette for mar + light', () => {
    expect(getColorThemeColors('mar', false)).toMatchObject(marLight)
  })

  it('returns mar dark palette for mar + dark', () => {
    expect(getColorThemeColors('mar', true)).toMatchObject(marDark)
  })

  it('each theme has distinct accent colors in light mode', () => {
    const humoAccent  = getColorThemeColors('humo',  false)['--accent']
    const aceraAccent = getColorThemeColors('acera', false)['--accent']
    const marAccent   = getColorThemeColors('mar',   false)['--accent']
    expect(humoAccent).not.toBe(aceraAccent)
    expect(humoAccent).not.toBe(marAccent)
    expect(aceraAccent).not.toBe(marAccent)
  })

  it('includes status aliases resolving to the correct primitives', () => {
    const palette = getColorThemeColors('humo', false)
    expect(palette['--status-error']).toBe('var(--charged)')
    expect(palette['--status-warning']).toBe('var(--active)')
    expect(palette['--status-success']).toBe('var(--calm)')
    expect(palette['--status-info']).toBe('var(--still)')
    expect(palette['--status-error-wash']).toBe('var(--charged-wash)')
    expect(palette['--status-warning-wash']).toBe('var(--active-wash)')
    expect(palette['--status-success-wash']).toBe('var(--calm-wash)')
    expect(palette['--status-info-wash']).toBe('var(--still-wash)')
  })

  it('status aliases are identical across all themes and modes', () => {
    const palettes = (['humo', 'acera', 'mar'] as const).flatMap(t => [
      getColorThemeColors(t, false),
      getColorThemeColors(t, true),
    ])
    for (const palette of palettes) {
      expect(palette['--status-error']).toBe('var(--charged)')
      expect(palette['--status-success']).toBe('var(--calm)')
    }
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
