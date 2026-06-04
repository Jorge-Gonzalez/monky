// @vitest-environment jsdom
import { render, screen } from '@testing-library/preact'
import { describe, it, expect, vi } from 'vitest'
import Popup from './Popup'

vi.mock('./MacroSearch', () => ({
  MacroSearch: ({ macros }: { macros: any[] }) => (
    <div>
      <input placeholder="popup.searchPlaceholder" />
      {macros.map(m => <div key={m.id}>{m.command}</div>)}
    </div>
  ),
}))
vi.mock('./SiteToggle', () => ({ default: () => <div><span>popup.macrosOnThisSite</span></div> }))
vi.mock('./ThemeSwitcher', () => ({ default: () => <div data-testid="theme-switcher-mock" /> }))
vi.mock('./NewMacroButton', () => ({ default: () => <button>popup.newMacro</button> }))
vi.mock('../../lib/i18n', () => ({ t: (key: string) => key }))
vi.mock('../../theme/hooks/useThemeColors', () => ({ useThemeColors: vi.fn() }))

vi.mock('../../store/useMacroStore', () => {
  const state = {
    macros: [
      { id: '1', command: '/brb', text: 'Be right back', is_sensitive: false },
      { id: '2', command: '/omw', text: 'On my way', is_sensitive: false },
    ],
    config: { theme: 'system', colorTheme: 'humo', language: 'en' },
  }
  return { useMacroStore: Object.assign((sel: any) => sel(state), { getState: () => state }) }
})

describe('Popup', () => {
  it('renders the title, sections and search', () => {
    render(<Popup />)
    expect(screen.getByText('popup.title')).toBeInTheDocument()
    expect(screen.getByText('popup.macrosOnThisSite')).toBeInTheDocument()
    expect(screen.getByTestId('theme-switcher-mock')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('popup.searchPlaceholder')).toBeInTheDocument()
  })
})
