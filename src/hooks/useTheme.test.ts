// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMacroStore } from '../store/useMacroStore'

// Mock the zustand store
vi.mock('../store/useMacroStore')

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

describe('useTheme hook', () => {
  let useTheme: any;
  const mockedUseMacroStore = vi.mocked(useMacroStore)

  beforeEach(async () => {
    // Reset mocks and DOM before each test
    // Dynamically import the hook to ensure it uses the mocked MQL
    // This is necessary because MQL is defined at the module level in useTheme.ts
    const module = await import('./useTheme');
    useTheme = module.useTheme;

    vi.clearAllMocks()
    document.documentElement.classList.remove('dark')
    MOCK_MATCH_MEDIA.matches = false
  })

  it('should not apply dark class for light theme', () => {
    mockedUseMacroStore.mockImplementation(selector => selector({ config: { theme: 'light' } }) as any)

    renderHook(() => useTheme())

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should apply dark class for dark theme', () => {
    mockedUseMacroStore.mockImplementation(selector => selector({ config: { theme: 'dark' } }) as any)

    renderHook(() => useTheme())

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  describe('system theme', () => {
    it('should use light mode when system preference is light', () => {
      MOCK_MATCH_MEDIA.matches = false
      mockedUseMacroStore.mockImplementation(selector => selector({ config: { theme: 'system' } }) as any)

      renderHook(() => useTheme())

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should use dark mode when system preference is dark', () => {
      MOCK_MATCH_MEDIA.matches = true
      mockedUseMacroStore.mockImplementation(selector => selector({ config: { theme: 'system' } }) as any)

      renderHook(() => useTheme())

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should react to system preference changes', () => {
      MOCK_MATCH_MEDIA.matches = false
      mockedUseMacroStore.mockImplementation(selector => selector({ config: { theme: 'system' } }) as any)

      renderHook(() => useTheme())
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      // Find the change handler the hook registered
      const changeHandler = MOCK_MATCH_MEDIA.addEventListener.mock.calls.find(
        (call) => call[0] === 'change',
      )?.[1]

      // The handler should exist
      expect(changeHandler).toBeDefined()

      // Simulate the system theme changing to dark
      act(() => {
        MOCK_MATCH_MEDIA.matches = true
        // The event object is passed to the handler
        changeHandler({ matches: true })
      })
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })
})