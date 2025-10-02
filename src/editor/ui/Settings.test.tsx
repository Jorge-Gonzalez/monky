// @vitest-environment jsdom
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Settings from './Settings'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Mock the store
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: vi.fn(() => ({
    config: {
      disabledSites: [],
      prefixes: ['/'],
      theme: 'system',
      language: 'en',
    },
    setLanguage: vi.fn(),
  })),
}))

describe('Settings Component', () => {
  it('renders without crashing', () => {
    render(<Settings />)
    expect(screen.getByText('settings.title')).toBeInTheDocument()
  })

  it('renders language settings section', () => {
    render(<Settings />)
    
    expect(screen.getByText('settings.language')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})