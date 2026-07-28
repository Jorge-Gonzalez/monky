import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/preact'
import { MacroSearchFooter } from './MacroSearchFooter'

describe('MacroSearchFooter — count label', () => {
  it('renders "1 macro" in macro mode', () => {
    render(
      <MacroSearchFooter
        count={1}
        isCommandMode={false}
      />
    )
    expect(screen.getByText('1 macro')).toBeTruthy()
  })

  it('renders "3 macros" in macro mode', () => {
    render(
      <MacroSearchFooter
        count={3}
        isCommandMode={false}
      />
    )
    expect(screen.getByText('3 macros')).toBeTruthy()
  })

  it('renders "0 macros" in macro mode', () => {
    render(
      <MacroSearchFooter
        count={0}
        isCommandMode={false}
      />
    )
    expect(screen.getByText('0 macros')).toBeTruthy()
  })

  it('renders "1 command" in command mode', () => {
    render(
      <MacroSearchFooter
        count={1}
        isCommandMode={true}
      />
    )
    expect(screen.getByText('1 command')).toBeTruthy()
  })

  it('renders "4 commands" in command mode', () => {
    render(
      <MacroSearchFooter
        count={4}
        isCommandMode={true}
      />
    )
    expect(screen.getByText('4 commands')).toBeTruthy()
  })

  it('renders "0 commands" in command mode', () => {
    render(
      <MacroSearchFooter
        count={0}
        isCommandMode={true}
      />
    )
    expect(screen.getByText('0 commands')).toBeTruthy()
  })
})

describe('MacroSearchFooter — keyboard hints', () => {
  const revealShortcuts = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Show keyboard shortcuts' }))

  it('hides shortcuts by default and exposes an icon-only disclosure button', () => {
    render(
      <MacroSearchFooter
        count={2}
        isCommandMode={false}
      />
    )
    const button = screen.getByRole('button', { name: 'Show keyboard shortcuts' })
    expect(button.textContent).toBe('')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText(':')).toBeNull()
  })

  it('shows ":" commands hint in macro mode', () => {
    const { container } = render(
      <MacroSearchFooter
        count={2}
        isCommandMode={false}
      />
    )
    revealShortcuts()
    // The colon is its own <kbd> element
    expect(screen.getByText(':')).toBeTruthy()
    expect(container.textContent).toContain('select')
  })

  it('does not show ":" commands hint in command mode', () => {
    render(
      <MacroSearchFooter
        count={2}
        isCommandMode={true}
      />
    )
    revealShortcuts()
    // In command mode the <kbd>:</kbd> element is absent
    expect(screen.queryByText(':')).toBeNull()
  })

  it('shows "run" hint in command mode', () => {
    const { container } = render(
      <MacroSearchFooter
        count={2}
        isCommandMode={true}
      />
    )
    revealShortcuts()
    expect(container.textContent).toContain('run')
  })

  it('shows "Tab" and "edit" hint in macro mode when hasSelection is true', () => {
    const { container } = render(
      <MacroSearchFooter
        count={2}
        isCommandMode={false}
        hasSelection={true}
      />
    )
    revealShortcuts()
    expect(screen.getByText('Tab')).toBeTruthy()
    expect(container.textContent).toContain('edit')
  })

  it('does not show "Tab" hint when hasSelection is false', () => {
    render(
      <MacroSearchFooter
        count={2}
        isCommandMode={false}
        hasSelection={false}
      />
    )
    revealShortcuts()
    expect(screen.queryByText('Tab')).toBeNull()
  })

  it('does not show "Tab" hint when hasSelection is omitted', () => {
    render(
      <MacroSearchFooter
        count={2}
        isCommandMode={false}
      />
    )
    revealShortcuts()
    expect(screen.queryByText('Tab')).toBeNull()
  })

  it('does not show "Tab" hint in command mode even when hasSelection is true', () => {
    render(
      <MacroSearchFooter
        count={2}
        isCommandMode={true}
        hasSelection={true}
      />
    )
    revealShortcuts()
    expect(screen.queryByText('Tab')).toBeNull()
  })

  it('shows "close" hint in both modes', () => {
    const { container, unmount } = render(
      <MacroSearchFooter
        count={1}
        isCommandMode={false}
      />
    )
    revealShortcuts()
    expect(container.textContent).toContain('close')
    unmount()

    const { container: c2 } = render(
      <MacroSearchFooter
        count={1}
        isCommandMode={true}
      />
    )
    revealShortcuts()
    expect(c2.textContent).toContain('close')
  })

  it('hides the shortcuts again when toggled', () => {
    render(
      <MacroSearchFooter
        count={2}
        isCommandMode={false}
      />
    )
    revealShortcuts()
    fireEvent.click(screen.getByRole('button', { name: 'Hide keyboard shortcuts' }))
    expect(screen.queryByText(':')).toBeNull()
  })
})
