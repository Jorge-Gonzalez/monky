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

// Mock TipTap components
let mockOnUpdate: ((params: { editor: any }) => void) | null = null

const mockEditor = {
  getHTML: vi.fn(() => ''),
  commands: {
    setContent: vi.fn(),
  },
  isActive: vi.fn(() => false),
  chain: vi.fn(() => ({
    focus: vi.fn(() => ({
      toggleBold: vi.fn(() => ({ run: vi.fn() })),
      toggleItalic: vi.fn(() => ({ run: vi.fn() })),
      toggleBulletList: vi.fn(() => ({ run: vi.fn() })),
      toggleOrderedList: vi.fn(() => ({ run: vi.fn() })),
      setLink: vi.fn(() => ({ run: vi.fn() })),
      unsetLink: vi.fn(() => ({ run: vi.fn() })),
    })),
  })),
}

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn((config: any) => {
    // Store the onUpdate callback so we can call it in tests
    mockOnUpdate = config?.onUpdate || null
    return mockEditor
  }),
  EditorContent: ({ editor, className }: { editor: any, className: string }) => (
    <div 
      className={className}
      data-testid="tiptap-editor"
      contentEditable={true}
      suppressContentEditableWarning={true}
      onInput={(e: any) => {
        // Simulate TipTap's onUpdate behavior
        if (mockOnUpdate) {
          mockOnUpdate({ editor: mockEditor })
        }
      }}
    >
      <div className="tiptap-content" data-testid="tiptap-content">
        {mockEditor.getHTML()}
      </div>
    </div>
  ),
}))

vi.mock('@tiptap/starter-kit', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}))

vi.mock('@tiptap/extension-link', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
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
    // Reset editor mock
    mockEditor.getHTML.mockReturnValue('')
    mockEditor.commands.setContent.mockClear()
    mockOnUpdate = null
  })

  it('renders without crashing', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    // Check for a visible element instead of form role since form element might not have explicit role
    expect(screen.getByLabelText('macroForm.triggerLabel')).toBeInTheDocument()
  })

  it('renders form fields correctly', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    expect(screen.getByLabelText('macroForm.triggerLabel')).toBeInTheDocument()
    expect(screen.getByText('macroForm.textLabel')).toBeInTheDocument()
    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'macroForm.saveButton' })).toBeInTheDocument()
  })

  it('allows user to input command and text', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const editorElement = screen.getByTestId('tiptap-editor')
    
    fireEvent.change(commandInput, { target: { value: '/test' } })
    
    // Simulate typing in the TipTap editor
    fireEvent.input(editorElement, { target: { textContent: 'Test text' } })
    mockEditor.getHTML.mockReturnValue('<p>Test text</p>')
    
    expect(commandInput).toHaveValue('/test')
    expect(mockEditor.getHTML()).toBe('<p>Test text</p>')
  })

  it('calls addMacro on submit when creating a new macro', async () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const editorElement = screen.getByTestId('tiptap-editor')
    const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
    
    fireEvent.change(commandInput, { target: { value: '/test' } })
    
    // Simulate typing in the TipTap editor and update the mock to return the new content
    mockEditor.getHTML.mockReturnValue('<p>Test text</p>')
    fireEvent.input(editorElement, { target: { textContent: 'Test text' } })
    
    fireEvent.click(submitButton)

    // Use waitFor to handle the async nature of submission
    await waitFor(() => {
      expect(mockAddMacro).toHaveBeenCalledWith({
        id: expect.any(Number),
        command: '/test',
        text: 'Test text',
        html: undefined, // Simple text doesn't need HTML
        contentType: 'text/plain',
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
    expect(mockEditor.commands.setContent).toHaveBeenCalledWith('Old text')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls updateMacro on submit when editing', async () => {
    const editingMacro = { id: 1, command: '/old', text: 'Old text' }
    render(<MacroForm editing={editingMacro} onDone={mockOnDone} />)

    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const editorElement = screen.getByTestId('tiptap-editor')
    const updateButton = screen.getByRole('button', { name: 'macroForm.updateButton' })

    fireEvent.change(commandInput, { target: { value: '/new' } })
    
    // Simulate typing in the TipTap editor and update the mock to return the new content
    mockEditor.getHTML.mockReturnValue('<p>New text</p>')
    fireEvent.input(editorElement, { target: { textContent: 'New text' } })
    
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockUpdateMacro).toHaveBeenCalledWith(editingMacro.id, {
        command: '/new',
        text: 'New text',
        html: undefined, // Simple text doesn't need HTML
        contentType: 'text/plain',
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

    // Test with only command (empty editor)
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    fireEvent.change(commandInput, { target: { value: '/test' } })
    mockEditor.getHTML.mockReturnValue('')
    fireEvent.click(submitButton)
    expect(mockAddMacro).not.toHaveBeenCalled()
  })

  it('detects rich content and saves as HTML', async () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const editorElement = screen.getByTestId('tiptap-editor')
    const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
    
    fireEvent.change(commandInput, { target: { value: '/rich' } })
    
    // Simulate rich content with bold text
    mockEditor.getHTML.mockReturnValue('<p><strong>Bold text</strong></p>')
    fireEvent.input(editorElement, { target: { textContent: 'Bold text' } })
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAddMacro).toHaveBeenCalledWith({
        id: expect.any(Number),
        command: '/rich',
        text: 'Bold text',
        html: '<p><strong>Bold text</strong></p>',
        contentType: 'text/html',
        is_sensitive: false,
      })
    })
  })

  it('displays an error message if submission fails', async () => {
    // Arrange: Mock the store to return an error
    const errorMessage = 'Duplicate command'
    mockAddMacro.mockReturnValue({ success: false, error: errorMessage })

    render(<MacroForm editing={null} onDone={mockOnDone} />)
    fireEvent.change(screen.getByLabelText('macroForm.triggerLabel'), { target: { value: '/fail' } })
    
    // Simulate typing in the TipTap editor and update the mock to return the new content
    mockEditor.getHTML.mockReturnValue('<p>This will fail</p>')
    const editorElement = screen.getByTestId('tiptap-editor')
    fireEvent.input(editorElement, { target: { textContent: 'This will fail' } })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

    // Assert
    expect(await screen.findByText(errorMessage)).toBeInTheDocument()
  })
})