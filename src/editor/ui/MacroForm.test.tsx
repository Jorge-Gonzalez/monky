// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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

// Mock medium-editor
const mockSubscribe = vi.fn()
const mockDestroy = vi.fn()
let editableInputCallback: (() => void) | null = null

const mockEditor = {
  subscribe: vi.fn((eventName: string, callback: () => void) => {
    if (eventName === 'editableInput') {
      editableInputCallback = callback
    }
    mockSubscribe(eventName, callback)
  }),
  destroy: mockDestroy,
}

vi.mock('medium-editor', () => {
  return {
    default: vi.fn(() => mockEditor),
  }
})

// Mock medium-editor CSS imports
vi.mock('medium-editor/dist/css/medium-editor.css', () => ({}))
vi.mock('medium-editor/dist/css/themes/default.css', () => ({}))

// Mock the store to be self-contained, avoiding the need for dynamic imports.
const mockAddMacro = vi.fn()
const mockUpdateMacro = vi.fn()
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: vi.fn().mockImplementation(selector =>
    selector({
      addMacro: mockAddMacro,
      updateMacro: mockUpdateMacro,
      config: {
        prefixes: ['/'],
        theme: 'light',
        useCommitKeys: false,
        disabledSites: []
      }
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
    mockSubscribe.mockClear()
    mockDestroy.mockClear()
    editableInputCallback = null
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
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'macroForm.saveButton' })).toBeInTheDocument()
  })

  it('allows user to input command', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    
    fireEvent.change(commandInput, { target: { value: '/test' } })
    
    expect(commandInput).toHaveValue('/test')
  })

  it('calls addMacro on submit when creating a new macro', async () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
    
    fireEvent.change(commandInput, { target: { value: '/test' } })
    
    // Simulate medium-editor content change
    const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
    if (editorDiv) {
      editorDiv.innerHTML = '<p>Test text</p>'
      // Trigger the medium-editor callback that updates the component state
      if (editableInputCallback) {
        act(() => {
          editableInputCallback()
        })
      }
    }
    
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
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls updateMacro on submit when editing', async () => {
    const editingMacro = { id: 1, command: '/old', text: 'Old text' }
    render(<MacroForm editing={editingMacro} onDone={mockOnDone} />)

    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const updateButton = screen.getByRole('button', { name: 'macroForm.updateButton' })

    fireEvent.change(commandInput, { target: { value: '/new' } })
    
    // Simulate medium-editor content change
    const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
    if (editorDiv) {
      editorDiv.innerHTML = '<p>New text</p>'
      // Trigger the medium-editor callback that updates the component state
      if (editableInputCallback) {
        act(() => {
          editableInputCallback()
        })
      }
    }
    
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

  it('does not submit if command is empty', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })

    // Test with empty fields
    fireEvent.click(submitButton)
    expect(mockAddMacro).not.toHaveBeenCalled()
  })

  it('detects rich content and saves as HTML', async () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
    
    fireEvent.change(commandInput, { target: { value: '/rich' } })
    
    // Simulate rich content with bold text
    const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
    if (editorDiv) {
      editorDiv.innerHTML = '<p><strong>Bold text</strong></p>'
      // Trigger the medium-editor callback that updates the component state
      if (editableInputCallback) {
        act(() => {
          editableInputCallback()
        })
      }
    }
    
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
    
    // Simulate some text content
    const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
    if (editorDiv) {
      editorDiv.innerHTML = '<p>This will fail</p>'
      // Trigger the medium-editor callback that updates the component state
      if (editableInputCallback) {
        act(() => {
          editableInputCallback()
        })
      }
    }

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

    // Assert
    expect(await screen.findByText(errorMessage)).toBeInTheDocument()
  })

  it('initializes and destroys medium editor correctly', async () => {
    const { unmount } = render(<MacroForm editing={null} onDone={mockOnDone} />)
    
    // Wait for the effect to run
    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith('editableInput', expect.any(Function))
    })
    
    // Unmount to trigger cleanup
    unmount()
    expect(mockDestroy).toHaveBeenCalled()
  })

  // New tests for validation behavior
  describe('Form Validation', () => {
    it('disables submit button when command is empty', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveClass('cursor-not-allowed')
    })

    it('disables submit button when text is empty (valid command, no content)', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/test' } })
      
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveClass('cursor-not-allowed')
    })

    it('keeps submit button disabled when valid command is entered but no text content is added', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      // Start with empty form - button should be disabled
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      expect(submitButton).toBeDisabled()
      
      // Add valid command - button should still be disabled (no content)
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/validcommand' } })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveClass('bg-gray-300', 'cursor-not-allowed')
      
      // Verify command input styling is correct (valid command)
      expect(commandInput).toHaveClass('border-gray-300', 'focus:ring-blue-500')
      expect(commandInput).not.toHaveClass('border-red-300')
    })

    it('disables submit button when command has invalid prefix', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: 'invalidcommand' } })
      
      // Simulate some text content
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = '<p>Some text</p>'
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }
      
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      expect(submitButton).toBeDisabled()
    })

    it('enables submit button when both command and text are valid', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/test' } })
      
      // Simulate some text content
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = '<p>Some text</p>'
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }
      
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      expect(submitButton).not.toBeDisabled()
      expect(submitButton).not.toHaveClass('cursor-not-allowed')
    })

    it('shows validation error for invalid prefix', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: 'invalidcommand' } })
      
      expect(screen.getByText(/Command must start with:/)).toBeInTheDocument()
    })

    it('shows red border for invalid command input', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: 'invalidcommand' } })
      
      expect(commandInput).toHaveClass('border-red-300', 'focus:ring-red-500')
    })

    it('shows normal border for valid command input', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/validcommand' } })
      
      expect(commandInput).toHaveClass('border-gray-300', 'focus:ring-blue-500')
      expect(commandInput).not.toHaveClass('border-red-300')
    })

    it('prevents form submission with validation error message when command is invalid', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: 'invalidcommand' } })
      
      // Simulate some text content
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = '<p>Some text</p>'
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }
      
      // Force click the disabled button (simulate form submission somehow)
      const form = commandInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Command must start with:/)).toBeInTheDocument()
      })
      
      expect(mockAddMacro).not.toHaveBeenCalled()
    })

    it('prevents form submission when text is empty', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/test' } })
      
      // Leave text empty
      const form = commandInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      await waitFor(() => {
        expect(screen.getByText('Text content is required')).toBeInTheDocument()
      })
      
      expect(mockAddMacro).not.toHaveBeenCalled()
    })

    it('updates placeholder text based on first prefix', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      expect(commandInput).toHaveAttribute('placeholder', 'e.g., /sig')
    })
  })

  // New tests for rich text behavior
  describe('Rich Text Support', () => {
    it('initializes medium-editor with rich text paste support', async () => {
      const MediumEditor = await import('medium-editor')
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      await waitFor(() => {
        expect(MediumEditor.default).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            paste: {
              forcePlainText: false,
              cleanPastedHTML: true,
              cleanReplacements: [],
              cleanAttrs: ['class', 'style', 'dir'],
              cleanTags: ['meta']
            }
          })
        )
      })
    })

    it('handles complex rich content with lists correctly', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/complex' } })
      
      // Simulate complex rich content with lists
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = '<p><b>La lista reloaded 3</b></p><ul><li>uno</li><li>dos</li><li>tres</li></ul><p>Otra mas</p>'
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }
      
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddMacro).toHaveBeenCalledWith({
          id: expect.any(Number),
          command: '/complex',
          text: expect.stringMatching(/La lista reloaded 3\s*\n\s*• uno\s*\n\s*• dos\s*\n\s*• tres\s*\n\s*Otra mas/),
          html: '<p><b>La lista reloaded 3</b></p><ul><li>uno</li><li>dos</li><li>tres</li></ul><p>Otra mas</p>',
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })

    it('handles ordered lists correctly in HTML-to-text conversion', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/ordered' } })
      
      // Simulate ordered list content
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = '<ol><li>First item</li><li>Second item</li></ol>'
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }
      
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddMacro).toHaveBeenCalledWith({
          id: expect.any(Number),
          command: '/ordered',
          text: expect.stringContaining('1. First item\n2. Second item'),
          html: '<ol><li>First item</li><li>Second item</li></ol>',
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })

    it('handles line breaks correctly in HTML-to-text conversion', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/linebreaks' } })
      
      // Simulate content with line breaks
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = '<p>Esto es un parrafo<br>dividido en dos lineas.</p><p>Y esto es otro parrafo aparte.</p>'
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }
      
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddMacro).toHaveBeenCalledWith({
          id: expect.any(Number),
          command: '/linebreaks',
          text: expect.stringContaining('Esto es un parrafo\ndividido en dos lineas.\n\nY esto es otro parrafo aparte.'),
          html: '<p>Esto es un parrafo<br>dividido en dos lineas.</p><p>Y esto es otro parrafo aparte.</p>',
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })

    it('falls back to plain text when HTML parsing fails', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/fallback' } })
      
      // Simulate malformed HTML that might cause parsing issues
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = 'Just plain text without tags'
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }
      
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddMacro).toHaveBeenCalledWith({
          id: expect.any(Number),
          command: '/fallback',
          text: 'Just plain text without tags',
          html: undefined, // No HTML for plain text
          contentType: 'text/plain',
          is_sensitive: false,
        })
      })
    })

    it('handles complex content with proper spacing after lists', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/spacing' } })
      
      // Your exact example HTML
      const complexHTML = '<p><b>La lista reloaded 3</b></p><p>Cuidado <i>pierde</i></p><ul><li>uno</li><li>dos</li><li>tres</li></ul><p>Otra mas</p><ol><li>algo</li><li>mas</li></ol><p>Esto es un parrafo<br>dividido en dos lineas.</p><p>Y esto es otro parrafo aparte.</p>'
      
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = complexHTML
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }
      
      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddMacro).toHaveBeenCalledWith({
          id: expect.any(Number),
          command: '/spacing',
          text: expect.stringMatching(/La lista reloaded 3\s*\n\s*Cuidado pierde\s*\n\s*• uno\s*\n\s*• dos\s*\n\s*• tres\s*\n\s*Otra mas\s*\n\s*1\. algo\s*\n\s*2\. mas\s*\n\s*Esto es un parrafo\s*\n\s*dividido en dos lineas\.\s*\n\s*Y esto es otro parrafo aparte/),
          html: complexHTML,
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })

    it('handles blockquotes with proper formatting and spacing', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/quote' } })

      const blockquoteHTML = '<blockquote>This is a quoted text that spans multiple lines.</blockquote><p>Regular paragraph after quote.</p>'
      
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = blockquoteHTML
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }

      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddMacro).toHaveBeenCalledWith({
          id: expect.any(Number),
          command: '/quote',
          text: expect.stringMatching(/> This is a quoted text that spans multiple lines\.\s*\n\s*Regular paragraph after quote\./),
          html: blockquoteHTML,
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })

    it('handles nested blockquotes with proper indentation', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/nested' } })

      const nestedBlockquoteHTML = '<blockquote>Outer quote<blockquote>Inner quote</blockquote>Back to outer</blockquote>'
      
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = nestedBlockquoteHTML
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }

      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddMacro).toHaveBeenCalledWith({
          id: expect.any(Number),
          command: '/nested',
          text: expect.stringMatching(/> Outer quote\s*\n\s*> Inner quote\s*\n\s*> Back to outer/),
          html: nestedBlockquoteHTML,
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })

    it('handles blockquotes mixed with other content', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)
      
      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/mixed' } })

      const mixedHTML = '<p>Introduction paragraph</p><blockquote>Important quote here</blockquote><ul><li>First item</li><li>Second item</li></ul><blockquote>Another quote</blockquote><p>Final paragraph</p>'
      
      const editorDiv = document.querySelector('.medium-editor-element') as HTMLElement
      if (editorDiv) {
        editorDiv.innerHTML = mixedHTML
        if (editableInputCallback) {
          act(() => {
            editableInputCallback()
          })
        }
      }

      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddMacro).toHaveBeenCalledWith({
          id: expect.any(Number),
          command: '/mixed',
          text: expect.stringMatching(/Introduction paragraph\s*\n\s*> Important quote here\s*\n\s*• First item\s*\n\s*• Second item\s*\n\s*> Another quote\s*\n\s*Final paragraph/),
          html: mixedHTML,
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })
  })
})