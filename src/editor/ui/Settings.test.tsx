// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import type { Mock } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Settings from './Settings'
import { useOptions } from '../../options'

vi.mock('../../lib/i18n', () => ({ t: (key: string) => key }))
vi.mock('../../options', () => ({ useOptions: vi.fn() }))

describe('Settings (editor page)', () => {
  const setLanguage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useOptions as Mock).mockReturnValue({ language: 'en', setLanguage })
  })

  it('renders the language selector', () => {
    render(<Settings />)
    expect(screen.getByText('settings.title')).toBeInTheDocument()
    expect(screen.getByText('settings.language')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows the current language', () => {
    render(<Settings />)
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('en')
  })

  it('calls setLanguage when the language changes', () => {
    render(<Settings />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'es' } })
    expect(setLanguage).toHaveBeenCalledWith('es')
  })
})
