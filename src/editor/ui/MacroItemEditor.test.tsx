import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MacroItemEditor from './MacroItemEditor'

// Simple mock - just make sure the component renders without errors
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: vi.fn(() => ({
    deleteMacro: vi.fn()
  }))
}))

vi.mock('../../lib/sync', () => ({
  deleteMacroLocalFirst: vi.fn()
}))

vi.mock('../../lib/i18n', () => ({
  t: vi.fn((key) => key)
}))

describe('MacroItemEditor Component', () => {
  const mockMacro = {
    id: 1,
    command: '/test',
    text: 'Test text'
  }

  const mockOnEdit = vi.fn()

  it('renders without crashing', () => {
    render(<MacroItemEditor macro={mockMacro} onEdit={mockOnEdit} />)
    expect(screen.getByText('/test')).toBeInTheDocument()
  })

  it('displays truncated text for long macros', () => {
    const longTextMacro = {
      ...mockMacro,
      text: 'A'.repeat(100)
    }
    
    render(<MacroItemEditor macro={longTextMacro} onEdit={mockOnEdit} />)
    expect(screen.getByText('A'.repeat(80) + '…')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    render(<MacroItemEditor macro={mockMacro} onEdit={mockOnEdit} />)
    
    fireEvent.click(screen.getByText('macroItemEditor.edit'))
    expect(mockOnEdit).toHaveBeenCalledWith(mockMacro)
  })
})