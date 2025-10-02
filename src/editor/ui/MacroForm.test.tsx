// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MacroForm from './MacroForm'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Mock the sync functions
vi.mock('../../lib/sync', () => ({
  createMacroLocalFirst: vi.fn(() => Promise.resolve()),
  updateMacroLocalFirst: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../lib/errors', () => ({
  getErrorMessage: vi.fn((error) => error),
}))

// Mock the store to be self-contained, avoiding the need for dynamic imports.
const mockAddMacro = vi.fn()
const mockUpdateMacro = vi.fn()
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: vi.fn().mockImplementation(selector =>
    selector({
      addMacro: mockAddMacro,
      updateMacro: mockUpdateMacro,
    }),
  ),
}))

describe('MacroForm Component', () => {
  const mockOnDone = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations for each test
    mockAddMacro.mockReturnValue({ success: true })
    mockUpdateMacro.mockReturnValue({ success: true })
  })

  it('renders without crashing', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    // Check for a visible element instead of form role since form element might not have explicit role
    expect(screen.getByLabelText('macroForm.triggerLabel')).toBeInTheDocument()
  })

  it('renders form fields correctly', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    expect(screen.getByLabelText('macroForm.triggerLabel')).toBeInTheDocument()
    expect(screen.getByLabelText('macroForm.textLabel')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'macroForm.saveButton' })).toBeInTheDocument()
  })

  it('allows user to input command and text', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const textInput = screen.getByLabelText('macroForm.textLabel')
    
    fireEvent.change(commandInput, { target: { value: '/test' } })
    fireEvent.change(textInput, { target: { value: 'Test text' } })
    
    expect(commandInput).toHaveValue('/test')
    expect(textInput).toHaveValue('Test text')
  })

  it('calls addMacro on submit when creating a new macro', async () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const textInput = screen.getByLabelText('macroForm.textLabel')
    const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
    
    fireEvent.change(commandInput, { target: { value: '/test' } })
    fireEvent.change(textInput, { target: { value: 'Test text' } })
    fireEvent.click(submitButton)

    // Use waitFor to handle the async nature of submission
    await waitFor(() => {
      expect(mockAddMacro).toHaveBeenCalledWith({
        id: expect.any(Number),
        command: '/test',
        text: 'Test text',
        is_sensitive: false,
      })
    })
  })

  it('pre-fills form and shows correct buttons when in editing mode', () => {
    const editingMacro = {
      id: 1,
      command: '/old',
      text: 'Old text',
      is_sensitive: true,
    }

    render(<MacroForm editing={editingMacro} onDone={mockOnDone} />)
    
    expect(screen.getByRole('button', { name: 'macroForm.updateButton' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'macroForm.cancelButton' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('/old')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Old text')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls updateMacro on submit when editing', async () => {
    const editingMacro = { id: 1, command: '/old', text: 'Old text' }
    render(<MacroForm editing={editingMacro} onDone={mockOnDone} />)

    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const textInput = screen.getByLabelText('macroForm.textLabel')
    const updateButton = screen.getByRole('button', { name: 'macroForm.updateButton' })

    fireEvent.change(commandInput, { target: { value: '/new' } })
    fireEvent.change(textInput, { target: { value: 'New text' } })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockUpdateMacro).toHaveBeenCalledWith(editingMacro.id, {
        command: '/new',
        text: 'New text',
        is_sensitive: false,
      })
      expect(mockOnDone).toHaveBeenCalled()
    })
  })

  it('does not submit if command or text is empty', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })

    // Test with empty fields
    fireEvent.click(submitButton)
    expect(mockAddMacro).not.toHaveBeenCalled()

    // Test with only command
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    fireEvent.change(commandInput, { target: { value: '/test' } })
    fireEvent.click(submitButton)
    expect(mockAddMacro).not.toHaveBeenCalled()
  })

  it('displays an error message if submission fails', async () => {
    // Arrange: Mock the store to return an error
    const errorMessage = 'Duplicate command'
    mockAddMacro.mockReturnValue({ success: false, error: errorMessage })

    render(<MacroForm editing={null} onDone={mockOnDone} />)
    fireEvent.change(screen.getByLabelText('macroForm.triggerLabel'), { target: { value: '/fail' } })
    fireEvent.change(screen.getByLabelText('macroForm.textLabel'), { target: { value: 'This will fail' } })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

    // Assert
    expect(await screen.findByText(errorMessage)).toBeInTheDocument()
  })
})