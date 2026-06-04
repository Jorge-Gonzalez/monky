// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi } from 'vitest'
import MacroItemEditor from './MacroItemEditor'

vi.mock('../../lib/i18n', () => ({ t: (key: string) => key }))

describe('MacroItemEditor', () => {
  const mockMacro = { id: 1, command: '/test', text: 'Test text' } as any
  const onEdit = vi.fn()
  const onDelete = vi.fn()

  it('renders the command', () => {
    render(<MacroItemEditor macro={mockMacro} onEdit={onEdit} onDelete={onDelete} />)
    expect(screen.getByText('/test')).toBeInTheDocument()
  })

  it('truncates long text', () => {
    const longTextMacro = { ...mockMacro, text: 'A'.repeat(100) }
    render(<MacroItemEditor macro={longTextMacro} onEdit={onEdit} onDelete={onDelete} />)
    expect(screen.getByText('A'.repeat(80) + '…')).toBeInTheDocument()
  })

  it('calls onEdit with the macro', () => {
    render(<MacroItemEditor macro={mockMacro} onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('macroItemEditor.edit'))
    expect(onEdit).toHaveBeenCalledWith(mockMacro)
  })

  it('calls onDelete with the macro id', () => {
    render(<MacroItemEditor macro={mockMacro} onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('macroItemEditor.delete'))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
