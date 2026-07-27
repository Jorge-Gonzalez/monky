// @vitest-environment jsdom
import { render, act } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMacroStore } from '../../store/useMacroStore'
import { themeSocketVars } from '../socketPalette'

// Mock the zustand store
vi.mock('../../store/useMacroStore')

const MOCK_MATCH_MEDIA = {
  matches: false,
  media: '(prefers-color-scheme: dark)',
  onchange: null,
  addListener: vi.fn(), // deprecated but included for coverage
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

vi.stubGlobal('matchMedia', () => MOCK_MATCH_MEDIA)

describe('ThemeManager component', () => {
  let ThemeManager: any
  const mockedUseMacroStore = vi.mocked(useMacroStore)

  beforeEach(async () => {
    // Reset mocks and DOM before each test
    const module = await import('./ThemeManager')
    ThemeManager = module.ThemeManager

    vi.clearAllMocks()
    document.documentElement.classList.remove('dark')
    MOCK_MATCH_MEDIA.matches = false
  })

  const mockConfig = (overrides: object) => ({
    config: { disabledSites: [], prefixes: ['/'], theme: 'light', colorTheme: 'humo', ...overrides }
  } as any)

  it('should not apply dark class for light theme', () => {
    mockedUseMacroStore.mockImplementation(selector => selector(mockConfig({ theme: 'light' })) as any)
    render(<ThemeManager />)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should apply dark class for dark theme', () => {
    mockedUseMacroStore.mockImplementation(selector => selector(mockConfig({ theme: 'dark' })) as any)
    render(<ThemeManager />)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  describe('system theme', () => {
    it('should use light mode when system preference is light', () => {
      MOCK_MATCH_MEDIA.matches = false
      mockedUseMacroStore.mockImplementation(selector => selector(mockConfig({ theme: 'system' })) as any)
      render(<ThemeManager />)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should use dark mode when system preference is dark', () => {
      MOCK_MATCH_MEDIA.matches = true
      mockedUseMacroStore.mockImplementation(selector => selector(mockConfig({ theme: 'system' })) as any)
      render(<ThemeManager />)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should react to system preference changes', () => {
      MOCK_MATCH_MEDIA.matches = false
      mockedUseMacroStore.mockImplementation(selector => selector(mockConfig({ theme: 'system' })) as any)
      render(<ThemeManager />)
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      const changeHandler = MOCK_MATCH_MEDIA.addEventListener.mock.calls.find(
        (call) => call[0] === 'change',
      )?.[1]
      expect(changeHandler).toBeDefined()

      act(() => {
        MOCK_MATCH_MEDIA.matches = true
        changeHandler({ matches: true })
      })
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('color theme CSS variables', () => {
    it('applies the correct accent color for each color theme in light mode', () => {
      for (const colorTheme of ['humo', 'acera', 'mar'] as const) {
        mockedUseMacroStore.mockImplementation(selector =>
          selector(mockConfig({ theme: 'light', colorTheme })) as any
        )
        render(<ThemeManager />)
        const expected = themeSocketVars(colorTheme, false)['--accent']
        expect(document.documentElement.style.getPropertyValue('--accent')).toBe(expected)
      }
    })

    it('applies the correct accent color for each color theme in dark mode', () => {
      for (const colorTheme of ['humo', 'acera', 'mar'] as const) {
        mockedUseMacroStore.mockImplementation(selector =>
          selector(mockConfig({ theme: 'dark', colorTheme })) as any
        )
        render(<ThemeManager />)
        const expected = themeSocketVars(colorTheme, true)['--accent']
        expect(document.documentElement.style.getPropertyValue('--accent')).toBe(expected)
      }
    })

    it('defaults to humo when colorTheme is not set', () => {
      // Deliberately omit colorTheme to exercise ThemeManager's runtime fallback.
      mockedUseMacroStore.mockImplementation(selector =>
        selector({ config: { disabledSites: [], prefixes: ['/'], theme: 'light' } } as any) as any
      )
      render(<ThemeManager />)
      const expected = themeSocketVars('humo', false)['--accent']
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(expected)
    })
  })
})