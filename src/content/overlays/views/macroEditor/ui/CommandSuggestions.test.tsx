// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandSuggestions } from './CommandSuggestions'

vi.mock('../../../../../lib/i18n', () => ({ t: (key: string) => key }))

const suggestions = [
  { id: 1, command: '/sig', text: 'My signature', contentType: 'text/plain' as const },
  { id: 2, command: '/sigh', text: 'Ugh', contentType: 'text/plain' as const },
]

function setup() {
  const onSelect = vi.fn()
  const onDelete = vi.fn()
  const utils = render(
    <CommandSuggestions suggestions={suggestions} selectedIndex={0} onSelect={onSelect} onDelete={onDelete} />
  )
  return { onSelect, onDelete, ...utils }
}

const trashOf = (row: Element) => row.querySelector('[aria-label="macroEditor.deleteMacro"]') as HTMLElement

describe('CommandSuggestions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a trash control per row by default (no confirm/cancel)', () => {
    setup()
    expect(screen.getAllByLabelText('macroEditor.deleteMacro')).toHaveLength(2)
    expect(screen.queryByLabelText('macroEditor.confirmDelete')).toBeNull()
  })

  it('arming a row swaps trash for confirm/cancel and tints only that row', () => {
    const { container } = setup()
    const rows = container.querySelectorAll('.command-suggestion-item')
    fireEvent.mouseDown(trashOf(rows[1]))

    expect(rows[1]).toHaveAttribute('data-state', 'confirming-delete')
    expect(rows[0]).not.toHaveAttribute('data-state')
    expect(screen.getByLabelText('macroEditor.confirmDelete')).toBeInTheDocument()
    expect(screen.getByLabelText('macroEditor.cancelDelete')).toBeInTheDocument()
    // The armed row no longer offers the plain trash; the other row still does.
    expect(screen.getAllByLabelText('macroEditor.deleteMacro')).toHaveLength(1)
  })

  it('confirming deletes that macro; the row click never fires select', () => {
    const { container, onDelete, onSelect } = setup()
    const rows = container.querySelectorAll('.command-suggestion-item')
    fireEvent.mouseDown(trashOf(rows[1]))
    fireEvent.mouseDown(screen.getByLabelText('macroEditor.confirmDelete'))

    expect(onDelete).toHaveBeenCalledWith(suggestions[1])
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('cancel disarms without deleting', () => {
    const { container, onDelete } = setup()
    const rows = container.querySelectorAll('.command-suggestion-item')
    fireEvent.mouseDown(trashOf(rows[1]))
    fireEvent.mouseDown(screen.getByLabelText('macroEditor.cancelDelete'))

    expect(onDelete).not.toHaveBeenCalled()
    expect(rows[1]).not.toHaveAttribute('data-state')
    expect(screen.getAllByLabelText('macroEditor.deleteMacro')).toHaveLength(2)
  })

  it('backs the selected suggestion with aria-selected', () => {
    const { container } = setup()
    const rows = container.querySelectorAll('.command-suggestion-item')
    expect(rows[0]).toHaveAttribute('aria-selected', 'true')
    expect(rows[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('clicking a row body selects it', () => {
    const { container, onSelect } = setup()
    const rows = container.querySelectorAll('.command-suggestion-item')
    fireEvent.mouseDown(rows[0])
    expect(onSelect).toHaveBeenCalledWith(suggestions[0])
  })
})
