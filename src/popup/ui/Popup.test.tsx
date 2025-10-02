// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Macro } from '../../types'

// Mock dependencies that are outside the component's direct control.
const mockSetTheme = vi.fn()
const mockMacros: Macro[] = [
  { id: '1', command: '/brb', text: 'Be right back', sensitive: false },
  { id: '2', command: '/omw', text: 'On my way', sensitive: false },
  { id: '3', command: '/meeting-notes', text: 'Here are the meeting notes.', sensitive: false },
]

const mockState = {
  config: {
    disabledSites: [],
    theme: 'system',
    language: 'en',
  },
  macros: mockMacros,
  toggleSiteDisabled: vi.fn(),
  setTheme: mockSetTheme,
}

// We are not using the real store, but a mock that allows us to control the state.
// The selector function passed to useMacroStore will be executed with mockState.
const useMacroStore = vi.fn().mockImplementation(selector => selector(mockState))
useMacroStore.getState = () => mockState
useMacroStore.subscribe = () => () => {} // Return an empty unsubscribe function

// Mock the module to export our more complete mock
vi.mock('../../store/useMacroStore', () => ({ useMacroStore }))

vi.mock('../../lib/i18n')
// We will test the interaction with the actual MacroSearch component, so we don't mock it.

describe('Popup Component', () => {
  // We need to use dynamic import here because of how vi.mock works (hoisting).
  let Popup: any
  let t: any

  beforeEach(async () => {
    // Reset mocks to ensure tests are isolated.
    vi.clearAllMocks()

    // Dynamically import mocked modules.
    const popupModule = await import('./Popup')
    Popup = popupModule.default
    const i18nModule = await import('../../lib/i18n')
    t = i18nModule.t

    // The `t` function will just return the key, so we can test for 'popup.title'
    // instead of the actual title string, which is more robust.
    ;(t as vi.Mock).mockImplementation(key => key)

    // Mock the tabs query to simulate being on a specific website.
    vi.mocked(chrome.tabs.query).mockImplementation((_, callback) => {
      callback([{ url: 'https://example.com' }])
    })
  })

  it('should display the correct text keys and hostname', async () => {

    // Act: Render the component.
    render(<Popup />)

    // Assert: Check that the correct text keys are rendered.
    // We use `findBy` for the first assertion to wait for the async `useEffect` to complete.
    expect(await screen.findByText('popup.title')).toBeTruthy()
    expect(screen.getByText('popup.synced')).toBeTruthy()
    expect(screen.getByText('popup.macrosOnThisSite')).toBeTruthy()

    // Assert that the hostname and child component are also rendered.
    expect(screen.getByText('example.com')).toBeTruthy()
    expect(screen.getByPlaceholderText('popup.searchPlaceholder')).toBeInTheDocument()
  })

  it('should call setTheme when theme buttons are clicked', async () => {
    // Arrange
    render(<Popup />)

    // Act & Assert
    fireEvent.click(screen.getByText('☀️'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
    fireEvent.click(screen.getByText('🌙'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('should filter macros when user types in the search box', async () => {
    // Arrange
    render(<Popup />)

    // Assert initial state: all macros are visible
    expect(screen.getByText('/brb')).toBeInTheDocument()
    expect(screen.getByText('/omw')).toBeInTheDocument()
    expect(screen.getByText('/meeting-notes')).toBeInTheDocument()

    // Act: search for a term present in the macro's text
    const searchInput = screen.getByPlaceholderText('popup.searchPlaceholder')
    fireEvent.change(searchInput, { target: { value: 'meeting' } })

    // Assert: only the matching macro is visible
    expect(screen.queryByText('/brb')).not.toBeInTheDocument()
    expect(screen.getByText('/meeting-notes')).toBeInTheDocument()
  })
})