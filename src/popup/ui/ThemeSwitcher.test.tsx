// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ThemeSwitcher from './ThemeSwitcher'

const setTheme = vi.fn()
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: (selector: any) => selector({ setTheme }),
}))

describe('ThemeSwitcher', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all three theme buttons', () => {
    render(<ThemeSwitcher />)
    expect(screen.getByRole('button', { name: /light theme/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dark theme/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /system theme/i })).toBeInTheDocument()
  })

  it('calls setTheme with the chosen mode', () => {
    render(<ThemeSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /light theme/i }))
    expect(setTheme).toHaveBeenCalledWith('light')
    fireEvent.click(screen.getByRole('button', { name: /dark theme/i }))
    expect(setTheme).toHaveBeenCalledWith('dark')
    fireEvent.click(screen.getByRole('button', { name: /system theme/i }))
    expect(setTheme).toHaveBeenCalledWith('system')
  })
})
