// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandSuggestions, SUGGESTIONS_LISTBOX_ID, suggestionOptionId } from './CommandSuggestions'

vi.mock('../../../../../lib/i18n', () => ({ t: (key: string) => key }))

const suggestions = [
  { id: 1, command: '/sig', text: 'My signature', contentType: 'text/plain' as const },
  { id: 2, command: '/sigh', text: 'Ugh', contentType: 'text/plain' as const },
]

function setup(armedId: number | null = null) {
  const cb = {
    onSelect: vi.fn(),
    onArm: vi.fn(),
    onConfirmDelete: vi.fn(),
    onDisarm: vi.fn(),
  }
  const utils = render(
    <CommandSuggestions suggestions={suggestions} activeIndex={0} armedId={armedId} {...cb} />
  )
  return { ...cb, ...utils }
}

const trashOf = (row: Element) => row.querySelector('[aria-label="editor.deleteMacro"]') as HTMLElement

describe('CommandSuggestions', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('listbox contract', () => {
    it('exposes the rows as options of a named listbox', () => {
      const { container } = setup()
      const listbox = container.querySelector(`#${SUGGESTIONS_LISTBOX_ID}`)!
      expect(listbox).toHaveAttribute('role', 'listbox')
      expect(listbox).toHaveAttribute('aria-labelledby')
      const options = listbox.querySelectorAll('[role="option"]')
      expect(options).toHaveLength(suggestions.length)
      expect([...options].map(o => o.id)).toEqual(suggestions.map((_, i) => suggestionOptionId(i)))
      expect(options[0]).toHaveAttribute('aria-selected', 'true')
    })

    it('keeps the heading outside the listbox, which may hold only options', () => {
      const { container } = setup()
      const listbox = container.querySelector(`#${SUGGESTIONS_LISTBOX_ID}`)!
      expect(listbox.querySelector('[data-component="editor-suggestions-label"]')).toBeNull()
      // Every direct child of the listbox is an option.
      expect([...listbox.children].every(c => c.getAttribute('role') === 'option')).toBe(true)
    })

    // aria-hidden on a focusable element is the aria-hidden-focus violation: a keyboard
    // user can land on something that has been removed from the accessibility tree, so the
    // screen reader goes silent while focus is somewhere real. Hiding a control and
    // leaving it tab-reachable is worse than either alone.
    it('leaves nothing focusable inside an aria-hidden subtree', () => {
      const { container } = setup(1)
      // closest() rather than a descendant selector: the delete button carries aria-hidden
      // itself, so `[aria-hidden] button` would not have matched it.
      const offenders = [...container.querySelectorAll('button, a[href], input, select, textarea')]
        .filter(el => el.closest('[aria-hidden="true"]') && el.getAttribute('tabindex') !== '-1')
      expect(offenders.map(el => el.getAttribute('data-component'))).toEqual([])
    })

    it('hides the row controls, whose keyboard equivalents live on the field', () => {
      const { container } = setup()
      expect(trashOf(container.querySelectorAll('[role="option"]')[0])).toHaveAttribute('aria-hidden', 'true')
      const armed = setup(1)
      expect(armed.container.querySelector('[data-component="editor-suggestions-item-confirm"]')
        ?.closest('[aria-hidden="true"]')).not.toBeNull()
    })
  })

  it('renders a trash control per row by default (no confirm/cancel)', () => {
    setup()
    expect(screen.getAllByLabelText('editor.deleteMacro')).toHaveLength(2)
    expect(screen.queryByLabelText('editor.confirmDelete')).toBeNull()
  })

  it('the trash asks the hook to arm that row, rather than arming it here', () => {
    const { container, onArm } = setup()
    fireEvent.mouseDown(trashOf(container.querySelectorAll('[aria-selected]')[1]))
    expect(onArm).toHaveBeenCalledWith(suggestions[1])
    // Nothing changed locally: the component holds no state of its own.
    expect(container.querySelector('[data-state]')).toBeNull()
  })

  it('renders the armed row from armedId, tinting only that one', () => {
    const { container } = setup(2)
    const rows = container.querySelectorAll('[aria-selected]')

    expect(rows[1]).toHaveAttribute('data-state', 'confirming-delete')
    expect(rows[0]).not.toHaveAttribute('data-state')
    expect(screen.getByLabelText('editor.confirmDelete')).toBeInTheDocument()
    expect(screen.getByLabelText('editor.cancelDelete')).toBeInTheDocument()
    // The armed row no longer offers the plain trash; the other row still does.
    expect(screen.getAllByLabelText('editor.deleteMacro')).toHaveLength(1)
  })

  it('confirming deletes that macro; the row click never fires select', () => {
    const { onConfirmDelete, onSelect } = setup(2)
    fireEvent.mouseDown(screen.getByLabelText('editor.confirmDelete'))

    expect(onConfirmDelete).toHaveBeenCalledWith(suggestions[1])
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('cancel asks to disarm without deleting', () => {
    const { onConfirmDelete, onDisarm } = setup(2)
    fireEvent.mouseDown(screen.getByLabelText('editor.cancelDelete'))

    expect(onDisarm).toHaveBeenCalled()
    expect(onConfirmDelete).not.toHaveBeenCalled()
  })

  it('backs the selected suggestion with aria-selected', () => {
    const { container } = setup()
    const rows = container.querySelectorAll('[aria-selected]')
    expect(rows[0]).toHaveAttribute('aria-selected', 'true')
    expect(rows[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('clicking a row body selects it', () => {
    const { container, onSelect } = setup()
    const rows = container.querySelectorAll('[aria-selected]')
    fireEvent.mouseDown(rows[0])
    expect(onSelect).toHaveBeenCalledWith(suggestions[0])
  })
})
