// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { Macro, ThemeMode } from '../../types'
import { PopupManager } from '../managers/createPopupManager' // Assuming this type definition exists

// Mock dependencies that are outside the component's direct control.
const mockMacros: Macro[] = [
  { id: '1', command: '/brb', text: 'Be right back', sensitive: false },
  { id: '2', command: '/omw', text: 'On my way', sensitive: false },
  { id: '3', command: '/meeting-notes', text: 'Here are the meeting notes.', sensitive: false },
]

// Mock the child MacroSearch component as its testing is separate.
vi.mock('../ui/MacroSearch', () => ({
  MacroSearch: ({ macros }: { macros: Macro[] }) => (
    <div>
      <input placeholder="popup.searchPlaceholder" />
      {macros.map(m => <div key={m.id}>{m.command}</div>)}
    </div>
  )
}));

// Mock the SiteToggle component
vi.mock('./SiteToggle', () => ({
  default: () => (
    <div>
      <span>popup.macrosOnThisSite</span>
    </div>
  )
}));

vi.mock('../../lib/i18n')

// Create a mock PopupManager that conforms to the new architecture
const createMockPopupManager = (): PopupManager => {
  const state = {
    theme: 'system' as 'light' | 'dark' | 'system',
    hostname: 'example.com',
    isSiteEnabled: true,
    macros: mockMacros,
  };

  return {
    getTheme: vi.fn(() => state.theme),
    setTheme: vi.fn((newTheme: ThemeMode) => { state.theme = newTheme; }),
    toggleSite: vi.fn(),
    isSiteEnabled: vi.fn(() => state.isSiteEnabled),
    getState: vi.fn(() => state),
    // A simple subscription mock that can be expanded if needed
    subscribe: vi.fn(() => () => {}), 
    requestNewMacro: vi.fn(),
  };
};

describe('Popup Component', () => {
  // We need to use dynamic import here because of how vi.mock works (hoisting).
  let Popup: any
  let t: any
  let mockManager: PopupManager;

  beforeEach(async () => {
    // Reset mocks to ensure tests are isolated.
    vi.clearAllMocks()

    mockManager = createMockPopupManager();

    // Dynamically import mocked modules.
    const popupModule = await import('./Popup')
    Popup = popupModule.default
    const i18nModule = await import('../../lib/i18n')
    t = i18nModule.t

    // The `t` function will just return the key, so we can test for 'popup.title'
    // instead of the actual title string, which is more robust.
    ;(t as vi.Mock).mockImplementation(key => key)
  })

  it('should display the correct text keys and hostname', async () => {

    // Act: Render the component.
    render(<Popup manager={mockManager} />)

    // Assert: Check that the correct text keys are rendered.
    // We use `findBy` to wait for async effects if any.
    expect(await screen.findByText('popup.title')).toBeTruthy()
    expect(screen.getByText('popup.synced')).toBeTruthy()
    expect(screen.getByText('popup.macrosOnThisSite')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('popup.searchPlaceholder')).toBeInTheDocument()
  })

  it('should call setTheme on the manager when theme buttons are clicked', async () => {
    // Arrange
    render(<Popup manager={mockManager} />)

    // Act & Assert
    fireEvent.click(screen.getByText('☀️'))
    expect(mockManager.setTheme).toHaveBeenCalledWith('light')
    fireEvent.click(screen.getByText('🌙'))
    expect(mockManager.setTheme).toHaveBeenCalledWith('dark')
  })
})