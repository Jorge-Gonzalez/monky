// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, act } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MacroForm from './MacroForm'

// JSDOM doesn't implement execCommand/queryCommandState — stub them
Object.defineProperty(document, 'execCommand', { value: vi.fn(() => false), writable: true })
Object.defineProperty(document, 'queryCommandState', { value: vi.fn(() => false), writable: true })

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Macro CRUD ops are mocked — the form just calls them.
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
vi.mock('../../store/macroCrud', () => ({
  createMacro: (data: any) => mockCreate(data),
  updateMacro: (id: any, data: any) => mockUpdate(id, data),
}))

// The form reads config.prefixes from the store.
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: vi.fn().mockImplementation((selector: any) =>
    selector({ config: { prefixes: ['/'], theme: 'light', useCommitKeys: false, disabledSites: [] } })
  ),
}))

function setEditorContent(html: string) {
  const editorDiv = document.querySelector('.content-editor-body') as HTMLElement
  if (editorDiv) {
    editorDiv.innerHTML = html
    act(() => { fireEvent.input(editorDiv) })
  }
}

describe('MacroForm Component', () => {
  const mockOnDone = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockReturnValue({ success: true })
    mockUpdate.mockReturnValue({ success: true })
  })

  it('renders without crashing', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    expect(screen.getByLabelText('macroForm.triggerLabel')).toBeInTheDocument()
  })

  it('focuses the command input when the form opens', async () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)

    await waitFor(() => {
      expect(screen.getByLabelText('macroForm.triggerLabel')).toHaveFocus()
    })
  })

  it('renders form fields correctly', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)

    expect(screen.getByLabelText('macroForm.triggerLabel')).toBeInTheDocument()
    expect(screen.getByText('macroForm.textLabel')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'macroForm.saveButton' })).toBeInTheDocument()
  })

  it('renders the content editor body', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    expect(document.querySelector('.content-editor-body')).toBeInTheDocument()
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
    setEditorContent('<p>Test text</p>')

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        command: '/test',
        text: 'Test text',
        html: undefined,
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

  it('re-focuses the command input when switching to a different macro', async () => {
    const firstMacro = { id: 1, command: '/old', text: 'Old text' }
    const secondMacro = { id: 2, command: '/new', text: 'New text' }
    const { rerender } = render(
      <MacroForm editing={firstMacro} onDone={mockOnDone} />
    )

    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    commandInput.blur()
    expect(commandInput).not.toHaveFocus()

    rerender(
      <MacroForm editing={secondMacro} onDone={mockOnDone} />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('/new')).toHaveFocus()
    })
  })

  it('calls updateMacro on submit when editing', async () => {
    const editingMacro = { id: 1, command: '/old', text: 'Old text' }
    render(<MacroForm editing={editingMacro} onDone={mockOnDone} />)

    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const updateButton = screen.getByRole('button', { name: 'macroForm.updateButton' })

    fireEvent.change(commandInput, { target: { value: '/new' } })
    setEditorContent('<p>New text</p>')

    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(String(editingMacro.id), {
        command: '/new',
        text: 'New text',
        html: undefined,
        contentType: 'text/plain',
        is_sensitive: false,
      })
      expect(mockOnDone).toHaveBeenCalled()
    })
  })

  it('does not submit if command is empty', () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)
    const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })

    fireEvent.click(submitButton)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('detects rich content and saves as HTML', async () => {
    render(<MacroForm editing={null} onDone={mockOnDone} />)

    const commandInput = screen.getByLabelText('macroForm.triggerLabel')
    const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })

    fireEvent.change(commandInput, { target: { value: '/rich' } })
    setEditorContent('<p><strong>Bold text</strong></p>')

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        command: '/rich',
        text: 'Bold text',
        html: '<p><strong>Bold text</strong></p>',
        contentType: 'text/html',
        is_sensitive: false,
      })
    })
  })

  it('displays an error message if submission fails', async () => {
    const errorMessage = 'Duplicate command'
    mockCreate.mockReturnValue({ success: false, error: errorMessage })

    render(<MacroForm editing={null} onDone={mockOnDone} />)
    fireEvent.change(screen.getByLabelText('macroForm.triggerLabel'), { target: { value: '/fail' } })
    setEditorContent('<p>This will fail</p>')

    fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

    expect(await screen.findByText(errorMessage)).toBeInTheDocument()
  })

  // New tests for validation behavior
  describe('Form Validation', () => {
    it('disables submit button when command is empty', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      expect(submitButton).toBeDisabled()
    })

    it('disables submit button when text is empty (valid command, no content)', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/test' } })

      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      expect(submitButton).toBeDisabled()
    })

    it('keeps submit button disabled when valid command is entered but no text content is added', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      expect(submitButton).toBeDisabled()

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/validcommand' } })
      expect(submitButton).toBeDisabled()

      expect(commandInput).toHaveClass('input')
      expect(commandInput).not.toHaveClass('input-error')
      expect(commandInput).not.toHaveClass('border-red-300')
    })

    it('disables submit button when command has invalid prefix', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: 'invalidcommand' } })
      setEditorContent('<p>Some text</p>')

      const submitButton = screen.getByRole('button', { name: 'macroForm.saveButton' })
      expect(submitButton).toBeDisabled()
    })

    it('enables submit button when both command and text are valid', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/test' } })
      setEditorContent('<p>Some text</p>')

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

      expect(commandInput).toHaveClass('input-error')
    })

    it('shows normal border for valid command input', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/validcommand' } })

      expect(commandInput).toHaveClass('input')
      expect(commandInput).not.toHaveClass('input-error')
    })

    it('prevents form submission with validation error message when command is invalid', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: 'invalidcommand' } })
      setEditorContent('<p>Some text</p>')

      const form = commandInput.closest('form')
      if (form) fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText(/Command must start with:/)).toBeInTheDocument()
      })

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('prevents form submission when text is empty', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/test' } })

      const form = commandInput.closest('form')
      if (form) fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Text content is required')).toBeInTheDocument()
      })

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('updates placeholder text based on first prefix', () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      expect(commandInput).toHaveAttribute('placeholder', 'e.g., /sig')
    })
  })

  // New tests for rich text behavior
  describe('Rich Text Support', () => {
    it('handles complex rich content with lists correctly', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/complex' } })

      const html = '<p><b>La lista reloaded 3</b></p><ul><li>uno</li><li>dos</li><li>tres</li></ul><p>Otra mas</p>'
      const normalizedHtml = '<p><strong>La lista reloaded 3</strong></p><ul><li>uno</li><li>dos</li><li>tres</li></ul><p>Otra mas</p>'
      setEditorContent(html)

      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
          command: '/complex',
          text: expect.stringMatching(/La lista reloaded 3\s*\n\s*• uno\s*\n\s*• dos\s*\n\s*• tres\s*\n\s*Otra mas/),
          html: normalizedHtml,
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })

    it('handles ordered lists correctly in HTML-to-text conversion', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/ordered' } })

      const html = '<ol><li>First item</li><li>Second item</li></ol>'
      setEditorContent(html)

      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
          command: '/ordered',
          text: expect.stringContaining('1. First item\n2. Second item'),
          html,
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })

    it('handles line breaks correctly in HTML-to-text conversion', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/linebreaks' } })

      const html = '<p>Esto es un parrafo<br>dividido en dos lineas.</p><p>Y esto es otro parrafo aparte.</p>'
      setEditorContent(html)

      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
          command: '/linebreaks',
          text: expect.stringContaining('Esto es un parrafo\ndividido en dos lineas.\n\nY esto es otro parrafo aparte.'),
          html,
          contentType: 'text/html',
          is_sensitive: false,
        })
      })
    })

    it('falls back to plain text when content has no rich formatting', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/fallback' } })
      setEditorContent('Just plain text without tags')

      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
          command: '/fallback',
          text: 'Just plain text without tags',
          html: undefined,
          contentType: 'text/plain',
          is_sensitive: false,
        })
      })
    })

    it('handles complex content with proper spacing after lists', async () => {
      render(<MacroForm editing={null} onDone={mockOnDone} />)

      const commandInput = screen.getByLabelText('macroForm.triggerLabel')
      fireEvent.change(commandInput, { target: { value: '/spacing' } })

      const complexHTML = '<p><b>La lista reloaded 3</b></p><p>Cuidado <i>pierde</i></p><ul><li>uno</li><li>dos</li><li>tres</li></ul><p>Otra mas</p><ol><li>algo</li><li>mas</li></ol><p>Esto es un parrafo<br>dividido en dos lineas.</p><p>Y esto es otro parrafo aparte.</p>'
      const normalizedComplexHTML = '<p><strong>La lista reloaded 3</strong></p><p>Cuidado <em>pierde</em></p><ul><li>uno</li><li>dos</li><li>tres</li></ul><p>Otra mas</p><ol><li>algo</li><li>mas</li></ol><p>Esto es un parrafo<br>dividido en dos lineas.</p><p>Y esto es otro parrafo aparte.</p>'
      setEditorContent(complexHTML)

      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
          command: '/spacing',
          text: expect.stringMatching(/La lista reloaded 3\s*\n\s*Cuidado pierde\s*\n\s*• uno\s*\n\s*• dos\s*\n\s*• tres\s*\n\s*Otra mas\s*\n\s*1\. algo\s*\n\s*2\. mas\s*\n\s*Esto es un parrafo\s*\n\s*dividido en dos lineas\.\s*\n\s*Y esto es otro parrafo aparte/),
          html: normalizedComplexHTML,
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
      setEditorContent(blockquoteHTML)

      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
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
      setEditorContent(nestedBlockquoteHTML)

      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
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
      setEditorContent(mixedHTML)

      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
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
