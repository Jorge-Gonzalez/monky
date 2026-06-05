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
