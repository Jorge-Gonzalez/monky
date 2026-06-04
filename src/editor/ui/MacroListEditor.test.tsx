// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi } from 'vitest'
import MacroListEditor from './MacroListEditor'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Mock MacroItemEditor since it's a child component
vi.mock('./MacroItemEditor', () => ({
  default: ({ macro, onEdit }: { macro: any, onEdit: (m: any) => void }) => (
    <div data-testid="macro-item-editor">
      <span>{macro.command}</span>
      <button onClick={() => onEdit(macro)}>Edit</button>
    </div>
  ),
}))

describe('MacroListEditor Component', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockMacros = [
    { id: 1, command: '/test1', text: 'Test text 1' },
    { id: 2, command: '/test2', text: 'Test text 2' },
  ] as any

  it('renders a MacroItemEditor per macro', () => {
    render(<MacroListEditor macros={mockMacros} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getAllByTestId('macro-item-editor')).toHaveLength(2)
    mockMacros.forEach((macro: any) => {
      expect(screen.getByText(macro.command)).toBeInTheDocument()
    })
  })

  it('displays a message when no macros exist', () => {
    render(<MacroListEditor macros={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    expect(screen.getByText('macroListEditor.noMacros')).toBeInTheDocument()
  })

  it('calls onEdit with the correct macro', () => {
    render(<MacroListEditor macros={mockMacros} onEdit={mockOnEdit} onDelete={mockOnDelete} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(mockOnEdit).toHaveBeenCalledWith(mockMacros[0])
  })
})