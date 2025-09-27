// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Popup from './Popup'

// Mock dependencies that are outside the component's direct control.
vi.mock('../../store/useMacroStore')
vi.mock('../../lib/i18n')
vi.mock('./MacroList', () => ({
  default: () => <div>MacroList Component</div>,
}))

describe('Popup Component', () => {
  // We need to use dynamic import here because of how vi.mock works (hoisting).
  let useMacroStore: any
  let t: any

  beforeEach(async () => {
    // Reset mocks to ensure tests are isolated.
    vi.clearAllMocks()

    // Dynamically import mocked modules.
    const i18nModule = await import('../../lib/i18n')
    t = i18nModule.t
    const storeModule = await import('../../store/useMacroStore')
    useMacroStore = storeModule.useMacroStore

    // The `t` function will just return the key, so we can test for 'popup.title'
    // instead of the actual title string, which is more robust.
    ;(t as vi.Mock).mockImplementation(key => key)

    // Mock the tabs query to simulate being on a specific website.
    vi.mocked(chrome.tabs.query).mockImplementation((_, callback) => {
      callback([{ url: 'https://example.com' }])
    })
  })

  it('should display the correct text keys and hostname', async () => {
    // Arrange: Set up the store with some default state.
    const mockState = {
      config: {
        disabledSites: [],
        theme: 'system',
      },
      macros: [],
      toggleSiteDisabled: vi.fn(),
      setTheme: vi.fn(),
    }
    ;(useMacroStore as vi.Mock).mockImplementation(selector => selector(mockState))

    // Act: Render the component.
    render(<Popup />)

    // Assert: Check that the correct text keys are rendered.
    // We use `findBy` for the first assertion to wait for the async `useEffect` to complete.
    expect(await screen.findByText('popup.title')).toBeTruthy()
    expect(screen.getByText('popup.synced')).toBeTruthy()
    expect(screen.getByText('popup.macrosOnThisSite')).toBeTruthy()

    // Assert that the hostname and child component are also rendered.
    expect(screen.getByText('example.com')).toBeTruthy()
    expect(screen.getByText('MacroList Component')).toBeTruthy()
  })

  it('should call setTheme when theme buttons are clicked', async () => {
    // Arrange
    const mockSetTheme = vi.fn()
    const mockState = {
      config: {
        disabledSites: [],
        theme: 'system',
      },
      macros: [],
      toggleSiteDisabled: vi.fn(),
      setTheme: mockSetTheme,
    }
    ;(useMacroStore as vi.Mock).mockImplementation(selector => selector(mockState))

    render(<Popup />)

    // Act & Assert
    fireEvent.click(screen.getByText('☀️'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
    fireEvent.click(screen.getByText('🌙'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})