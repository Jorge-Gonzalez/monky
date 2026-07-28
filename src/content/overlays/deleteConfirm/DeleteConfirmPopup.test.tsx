// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeleteConfirmPopup } from './DeleteConfirmPopup'

vi.mock('../../../lib/i18n', () => ({ t: (key: string) => key }))
vi.mock('../../../theme/hooks/useAppliedTheme', () => ({ useAppliedTheme: () => {} }))

const macro = { id: '1', command: '/note', text: 'Notes', contentType: 'text/plain' as const }

function setup() {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <DeleteConfirmPopup
      macro={macro}
      position={{ x: 0, y: 0 }}
      placement="bottom"
      isVisible
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
  return { onConfirm, onCancel }
}

// fireEvent wraps the dispatch in act(), so state + effects flush between presses.
const press = (key: string, opts: KeyboardEventInit = {}) =>
  fireEvent.keyDown(document, { key, bubbles: true, cancelable: true, ...opts })

describe('DeleteConfirmPopup', () => {
  // A screen reader reads what has focus. Nothing here was focused before, so the popup
  // was drawn, operated and dismissed without a word of it being announced.
  describe('announcement contract', () => {
    it('is an alertdialog named by its message', () => {
      setup()
      const dialog = screen.getByRole('alertdialog')
      const labelledBy = dialog.getAttribute('aria-labelledby')!
      expect(document.getElementById(labelledBy)?.textContent).toContain('deleteConfirm.message')
    })

    it('takes focus when it opens, so there is something to announce', () => {
      setup()
      expect(document.activeElement).toBe(screen.getByRole('listbox'))
    })

    it('points aria-activedescendant at the armed option and follows the selection', () => {
      setup()
      const listbox = screen.getByRole('listbox')
      const options = screen.getAllByRole('option')
      expect(listbox.getAttribute('aria-activedescendant')).toBe(options[0].id)
      press('ArrowRight')
      expect(listbox.getAttribute('aria-activedescendant')).toBe(options[1].id)
    })

    it('keeps the options out of the tab order, since the listbox owns focus', () => {
      setup()
      for (const option of screen.getAllByRole('option')) {
        expect(option).toHaveAttribute('tabIndex', '-1')
      }
    })
  })
  beforeEach(() => vi.clearAllMocks())

  it('shows the macro command and both options', () => {
    setup()
    expect(screen.getByText('/note')).toBeInTheDocument()
    expect(screen.getByText('deleteConfirm.cancel')).toBeInTheDocument()
    expect(screen.getByText('deleteConfirm.delete')).toBeInTheDocument()
  })

  it('defaults to Cancel — a stray Enter cancels, never deletes', () => {
    const { onConfirm, onCancel } = setup()
    press('Enter')
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Tab moves to Delete, then Enter confirms', () => {
    const { onConfirm, onCancel } = setup()
    press('Tab')
    press('Enter')
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('Escape cancels', () => {
    const { onConfirm, onCancel } = setup()
    press('Escape')
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('clicking Delete confirms, clicking Cancel cancels', () => {
    const { onConfirm, onCancel } = setup()
    fireEvent.mouseDown(screen.getByText('deleteConfirm.delete'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.mouseDown(screen.getByText('deleteConfirm.cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
