// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ModalMacroForm } from './ModalMacroForm'

Object.defineProperty(document, 'execCommand', { value: vi.fn(() => false), writable: true })
Object.defineProperty(document, 'queryCommandState', { value: vi.fn(() => false), writable: true })

vi.mock('../../../../../lib/i18n', () => ({
  t: (key: string) => key,
}))

const mockMacros = [
  { id: 1, command: '/sig',  text: 'My signature', is_sensitive: false },
  { id: 2, command: '/addr', text: 'My address',   is_sensitive: false },
  { id: 3, command: '/silk', text: 'Silk road',     is_sensitive: false },
  { id: 4, command: '/br',   text: 'Be right back', is_sensitive: false },
  { id: 5, command: '/sigh', text: 'Ugh',           is_sensitive: false },
  { id: 6, command: '/slow', text: 'Moving slow',   is_sensitive: false },
]

vi.mock('../../../../../store/useMacroStore', () => ({
  useMacroStore: vi.fn().mockImplementation(selector =>
    selector({
      macros: mockMacros,
      config: { prefixes: ['/'], theme: 'light' },
    })
  ),
}))

type CrudResult = { success: boolean; error?: string }
const mockCreate = vi.fn((..._args: any[]): Promise<CrudResult> => Promise.resolve({ success: true }))
const mockUpdate = vi.fn((..._args: any[]): Promise<CrudResult> => Promise.resolve({ success: true }))
const mockDelete = vi.fn()
vi.mock('../../../../../store/macroCrud', () => ({
  createMacro: (data: any) => mockCreate(data),
  updateMacro: (id: any, data: any) => mockUpdate(id, data),
  deleteMacro: (id: string) => mockDelete(id),
}))

function setEditorContent(html: string) {
  const el = document.querySelector('[contenteditable]') as HTMLElement
  if (el) { el.innerHTML = html; fireEvent.input(el) }
}

function getCommandInput() {
  return screen.getByLabelText('macroForm.triggerLabel')
}

function focusAndType(input: HTMLElement, value: string) {
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value } })
}

describe('ModalMacroForm', () => {
  const onDone = vi.fn()
  const onLoadMacro = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({ success: true })
    mockUpdate.mockResolvedValue({ success: true })
  })

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders the command input, content editor, checkbox and save button', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)

      expect(screen.getByLabelText('macroForm.triggerLabel')).toBeInTheDocument()
      expect(document.querySelector('[contenteditable]')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'macroForm.saveButton' })).toBeInTheDocument()
    })

    it('focuses the command input on mount', async () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)
      await waitFor(() => expect(getCommandInput()).toHaveFocus())
    })

    it('pre-fills fields and shows Update/Cancel buttons when editing', () => {
      const editing = { id: 1, command: '/sig', text: 'My signature', is_sensitive: true }
      render(<ModalMacroForm editing={editing} onDone={onDone} onLoadMacro={onLoadMacro} />)

      expect(screen.getByDisplayValue('/sig')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeChecked()
      expect(screen.getByRole('button', { name: 'macroForm.updateButton' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'macroForm.cancelButton' })).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Suggestion dropdown
  // ---------------------------------------------------------------------------

  describe('suggestion dropdown', () => {
    it('shows suggestions matching the typed command prefix', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)

      focusAndType(getCommandInput(), '/si')

      expect(screen.getByText('/sig')).toBeInTheDocument()
      expect(screen.getByText('/silk')).toBeInTheDocument()
      expect(screen.getByText('/sigh')).toBeInTheDocument()
    })

    it('matches only the command field, not the text content', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)

      // 'signature' is in the text of /sig but not in the command of any macro
      focusAndType(getCommandInput(), '/signature')

      expect(screen.queryByText('/sig')).not.toBeInTheDocument()
    })

    it('shows at most 5 suggestions', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)

      // '/' matches all 6 macros, but we cap at 5
      focusAndType(getCommandInput(), '/')

      const items = document.querySelectorAll('[aria-selected]')
      expect(items.length).toBeLessThanOrEqual(5)
    })

    it('does not show suggestions when editing an existing macro', () => {
      const editing = { id: 1, command: '/sig', text: 'My signature', is_sensitive: false }
      render(<ModalMacroForm editing={editing} onDone={onDone} onLoadMacro={onLoadMacro} />)

      focusAndType(getCommandInput(), '/si')

      expect(screen.queryByText('editor.commandSuggestionsLabel')).not.toBeInTheDocument()
    })

    // Note: blur → close is not reliably testable in jsdom (fireEvent.blur doesn't
    // trigger Preact's onBlur handler). The focus path is covered implicitly by
    // every other suggestion test via focusAndType.

    it('calls onLoadMacro when a suggestion is clicked', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)

      focusAndType(getCommandInput(), '/si')
      fireEvent.mouseDown(screen.getByText('/sig'))

      expect(onLoadMacro).toHaveBeenCalledWith(mockMacros[0])
    })

    it('navigates suggestions with arrow keys and selects with Enter', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)
      const input = getCommandInput()

      focusAndType(input, '/si')
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onLoadMacro).toHaveBeenCalledTimes(1)
    })

    it('loads macro on Enter when the typed command is an exact match', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)
      const input = getCommandInput()

      focusAndType(input, '/sig')
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onLoadMacro).toHaveBeenCalledWith(mockMacros[0])
    })

    it('dismisses suggestions on Enter when there is no exact match', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)
      const input = getCommandInput()

      focusAndType(input, '/si')
      expect(screen.queryByText('editor.commandSuggestionsLabel')).toBeInTheDocument()

      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onLoadMacro).not.toHaveBeenCalled()
      expect(screen.queryByText('editor.commandSuggestionsLabel')).not.toBeInTheDocument()
    })

    it('closes suggestions on Escape without propagating the event', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)
      const input = getCommandInput()
      focusAndType(input, '/si')

      const parentHandler = vi.fn()
      input.parentElement!.addEventListener('keydown', parentHandler)

      fireEvent.keyDown(input, { key: 'Escape' })

      expect(screen.queryByText('editor.commandSuggestionsLabel')).not.toBeInTheDocument()
      expect(parentHandler).not.toHaveBeenCalled()

      input.parentElement!.removeEventListener('keydown', parentHandler)
    })

    // The three layers -- field, list, armed -- are one value, so Enter and Escape need no
    // conditionals: they act on the innermost layer present, and Escape peels exactly one.
    describe('layered keyboard model', () => {
      const openList = () => {
        render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)
        const input = getCommandInput()
        focusAndType(input, '/si')
        return input
      }
      const armed = () => document.querySelector('[data-state="confirming-delete"]')

      it('Shift+Delete arms the highlighted row; a bare Delete is left to the field', () => {
        const input = openList()
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'Delete' })
        expect(armed()).toBeNull()
        fireEvent.keyDown(input, { key: 'Delete', shiftKey: true })
        expect(armed()).not.toBeNull()
      })

      it('Escape peels one layer: armed, then the list', () => {
        const input = openList()
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'Delete', shiftKey: true })

        fireEvent.keyDown(input, { key: 'Escape' })
        expect(armed()).toBeNull()
        expect(screen.queryByText('editor.commandSuggestionsLabel')).toBeInTheDocument()

        fireEvent.keyDown(input, { key: 'Escape' })
        expect(screen.queryByText('editor.commandSuggestionsLabel')).not.toBeInTheDocument()
      })

      it('Enter confirms the armed row rather than loading it', () => {
        const input = openList()
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'Delete', shiftKey: true })
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(mockDelete).toHaveBeenCalled()
        expect(onLoadMacro).not.toHaveBeenCalled()
      })

      it('Enter loads the highlighted row when nothing is armed', () => {
        const input = openList()
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(onLoadMacro).toHaveBeenCalled()
        expect(mockDelete).not.toHaveBeenCalled()
      })

      it('Tab moves the highlight instead of leaving the field', () => {
        const input = openList()
        fireEvent.keyDown(input, { key: 'Tab' })
        expect(input.getAttribute('aria-activedescendant')).toBeTruthy()
      })
    })

    it('resets dismissed state when the command changes', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)
      const input = getCommandInput()

      focusAndType(input, '/si')
      fireEvent.keyDown(input, { key: 'Escape' })
      expect(screen.queryByText('editor.commandSuggestionsLabel')).not.toBeInTheDocument()

      // Typing a new character resets dismissal
      focusAndType(input, '/sil')
      expect(screen.queryByText('editor.commandSuggestionsLabel')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Dirty check — Update button
  // ---------------------------------------------------------------------------

  describe('dirty check', () => {
    const editing = { id: 1, command: '/sig', text: 'My signature', is_sensitive: false }

    it('keeps Update disabled when no changes have been made', () => {
      render(<ModalMacroForm editing={editing} onDone={onDone} onLoadMacro={onLoadMacro} />)
      expect(screen.getByRole('button', { name: 'macroForm.updateButton' })).toBeDisabled()
    })

    it('enables Update after the command is changed', () => {
      render(<ModalMacroForm editing={editing} onDone={onDone} onLoadMacro={onLoadMacro} />)
      fireEvent.change(getCommandInput(), { target: { value: '/sigv2' } })
      expect(screen.getByRole('button', { name: 'macroForm.updateButton' })).not.toBeDisabled()
    })

    it('enables Update after the text content is changed', () => {
      render(<ModalMacroForm editing={editing} onDone={onDone} onLoadMacro={onLoadMacro} />)
      setEditorContent('<p>Updated text</p>')
      expect(screen.getByRole('button', { name: 'macroForm.updateButton' })).not.toBeDisabled()
    })

    it('enables Update after the sensitive flag is toggled', () => {
      render(<ModalMacroForm editing={editing} onDone={onDone} onLoadMacro={onLoadMacro} />)
      fireEvent.click(screen.getByRole('checkbox'))
      expect(screen.getByRole('button', { name: 'macroForm.updateButton' })).not.toBeDisabled()
    })
  })

  // ---------------------------------------------------------------------------
  // Form submission
  // ---------------------------------------------------------------------------

  describe('form submission', () => {
    it('calls createMacro, confirms the save, then closes the modal', async () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)

      fireEvent.change(getCommandInput(), { target: { value: '/new' } })
      setEditorContent('<p>Some text</p>')
      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      await screen.findByText('macroForm.savedToast')
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ command: '/new' }))
      await waitFor(() => expect(onDone).toHaveBeenCalled(), { timeout: 1500 })
    })

    it('calls updateMacro, confirms the update, then closes the modal', async () => {
      const editing = { id: 1, command: '/sig', text: 'My signature', is_sensitive: false }
      render(<ModalMacroForm editing={editing} onDone={onDone} onLoadMacro={onLoadMacro} />)

      fireEvent.change(getCommandInput(), { target: { value: '/sig2' } })
      fireEvent.click(screen.getByRole('button', { name: 'macroForm.updateButton' }))

      await screen.findByText('macroForm.updatedToast')
      expect(mockUpdate).toHaveBeenCalledWith('1', expect.objectContaining({ command: '/sig2' }))
      await waitFor(() => expect(onDone).toHaveBeenCalled(), { timeout: 1500 })
    })

    it('calls onDone when Cancel is clicked', () => {
      const editing = { id: 1, command: '/sig', text: 'My signature', is_sensitive: false }
      render(<ModalMacroForm editing={editing} onDone={onDone} onLoadMacro={onLoadMacro} />)

      fireEvent.click(screen.getByRole('button', { name: 'macroForm.cancelButton' }))
      expect(onDone).toHaveBeenCalled()
    })

    it('shows error message when coordinator returns a failure', async () => {
      mockCreate.mockResolvedValue({ success: false, error: 'Duplicate command' })
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)

      fireEvent.change(getCommandInput(), { target: { value: '/dup' } })
      setEditorContent('<p>Some text</p>')
      fireEvent.click(screen.getByRole('button', { name: 'macroForm.saveButton' }))

      expect(await screen.findByText('Duplicate command')).toBeInTheDocument()
    })

    it('keeps Save disabled when command has invalid prefix', () => {
      render(<ModalMacroForm editing={null} onDone={onDone} onLoadMacro={onLoadMacro} />)
      fireEvent.change(getCommandInput(), { target: { value: 'nosig' } })
      setEditorContent('<p>Some text</p>')
      expect(screen.getByRole('button', { name: 'macroForm.saveButton' })).toBeDisabled()
    })
  })
})
