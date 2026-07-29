// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MacroListToolbar } from './MacroListToolbar'

vi.mock('../../lib/i18n', () => ({
  t: (key: string, opts?: Record<string, string>) => (opts ? `${key}:${Object.values(opts).join(',')}` : key),
}))

const handlers = {
  onEdit: vi.fn(),
  onRequestDelete: vi.fn(),
  onConfirmDelete: vi.fn(),
  onCancelDelete: vi.fn(),
  onClear: vi.fn(),
}

const setup = (selectedCount: number, confirmingDelete = false) =>
  render(
    <MacroListToolbar
      selectedCount={selectedCount}
      confirmingDelete={confirmingDelete}
      {...handlers}
    />
  )

const button = (name: string) => screen.getByRole('button', { name })
const click = (name: string) => {
  void act(() => {
    fireEvent.click(button(name))
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MacroListToolbar — what applies to the selection', () => {
  it('disables both actions with nothing selected', () => {
    setup(0)
    expect(button('macroPanel.edit')).toBeDisabled()
    expect(button('macroPanel.delete')).toBeDisabled()
  })

  it('enables both with exactly one selected', () => {
    setup(1)
    expect(button('macroPanel.edit')).toBeEnabled()
    expect(button('macroPanel.delete')).toBeEnabled()
  })

  it('keeps delete but disables edit with several selected', () => {
    // The form holds one macro, so editing several has no meaning. Disabling is the honest
    // answer; silently editing one of them would not be.
    setup(3)
    expect(button('macroPanel.edit')).toBeDisabled()
    expect(button('macroPanel.delete')).toBeEnabled()
  })

  it('offers a way to clear only while something is selected', () => {
    setup(0)
    expect(screen.queryByRole('button', { name: 'macroPanel.clearSelection' })).not.toBeInTheDocument()
    setup(2)
    expect(button('macroPanel.clearSelection')).toBeInTheDocument()
  })

  it('reports the count, and the list name when nothing is selected', () => {
    setup(0)
    expect(screen.getByRole('status')).toHaveTextContent('macroPanel.label')
    setup(4)
    expect(screen.getAllByRole('status')[1]).toHaveTextContent('macroPanel.selectedCount:4')
  })

  it('is a labelled toolbar', () => {
    setup(0)
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'macroPanel.toolbarLabel')
  })
})

describe('MacroListToolbar — the destructive path', () => {
  it('asks rather than deletes when delete is pressed', () => {
    setup(2)
    click('macroPanel.delete')
    expect(handlers.onRequestDelete).toHaveBeenCalledTimes(1)
    expect(handlers.onConfirmDelete).not.toHaveBeenCalled()
  })

  it('replaces the actions with a confirmation naming the count', () => {
    setup(3, true)
    expect(screen.queryByRole('button', { name: 'macroPanel.edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'macroPanel.delete' })).not.toBeInTheDocument()
    expect(button('macroPanel.confirmDelete:3')).toBeInTheDocument()
  })

  it('deletes only on the confirmation, and stands down on cancel', () => {
    setup(3, true)
    click('macroPanel.cancelDelete')
    expect(handlers.onCancelDelete).toHaveBeenCalledTimes(1)
    expect(handlers.onConfirmDelete).not.toHaveBeenCalled()

    click('macroPanel.confirmDelete:3')
    expect(handlers.onConfirmDelete).toHaveBeenCalledTimes(1)
  })

  it('routes edit and clear to their own handlers', () => {
    setup(1)
    click('macroPanel.edit')
    expect(handlers.onEdit).toHaveBeenCalledTimes(1)
    click('macroPanel.clearSelection')
    expect(handlers.onClear).toHaveBeenCalledTimes(1)
  })
})
