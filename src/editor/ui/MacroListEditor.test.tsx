// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
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
  const mockMacros = [
    { id: 1, command: '/test1', text: 'Test text 1' },
    { id: 2, command: '/test2', text: 'Test text 2' },
  ]

  it('renders without crashing', () => {
    render(<MacroListEditor macros={mockMacros} onEdit={mockOnEdit} />)
    expect(screen.getAllByTestId('macro-item-editor')).toHaveLength(2)
  })

  it('displays message when no macros exist', () => {
    render(<MacroListEditor macros={[]} onEdit={mockOnEdit} />)
    expect(screen.getByText('macroListEditor.noMacros')).toBeInTheDocument()
  })

  it('renders a MacroItemEditor for each macro', () => {
    render(<MacroListEditor macros={mockMacros} onEdit={mockOnEdit} />)
    
    mockMacros.forEach(macro => {
      expect(screen.getByText(macro.command)).toBeInTheDocument()
    })
  })

  it('calls onEdit with the correct macro when an item is edited', () => {
    render(<MacroListEditor macros={mockMacros} onEdit={mockOnEdit} />)

    // Find all the "Edit" buttons rendered by our mock components
    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    // Click the first one
    fireEvent.click(editButtons[0])

    expect(mockOnEdit).toHaveBeenCalledWith(mockMacros[0])
  })
})