// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../../types'
import { MacroPanel } from './MacroPanel'

vi.mock('../../lib/i18n', () => ({
  t: (key: string, opts?: Record<string, string>) => (opts ? `${key}:${Object.values(opts).join(',')}` : key),
}))

const deleteMacros = vi.fn()
vi.mock('../../store/macroCrud', () => ({ deleteMacros: (ids: string[]) => deleteMacros(ids) }))

const MACROS: Macro[] = [
  { id: '1', command: '/a', text: 'Alpha', contentType: 'text/plain' },
  { id: '2', command: '/b', text: 'Bravo', contentType: 'text/plain' },
  { id: '3', command: '/c', text: 'Charlie', contentType: 'text/plain' },
]

const onEdit = vi.fn()
const setup = (macros: Macro[] = MACROS) =>
  render(
    <MacroPanel
      macros={macros}
      onEdit={onEdit}
    />
  )

const options = () => screen.getAllByRole('option')
const button = (name: string) => screen.getByRole('button', { name })
const click = (el: Element, mods: Record<string, boolean> = {}) => {
  void act(() => {
    fireEvent.click(el, mods)
  })
}
const press = (key: string, mods: Record<string, boolean> = {}) => {
  void act(() => {
    fireEvent.keyDown(screen.getByRole('listbox'), { key, ...mods })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MacroPanel — editing', () => {
  it('hands the one selected macro to the editor', () => {
    setup()
    click(options()[1])
    click(button('macroPanel.edit'))
    expect(onEdit).toHaveBeenCalledWith(MACROS[1])
  })

  it('edits on Enter in the list as well as from the toolbar', () => {
    setup()
    click(options()[2])
    press('Enter')
    expect(onEdit).toHaveBeenCalledWith(MACROS[2])
  })

  it('edits nothing when several are selected, even if asked directly', () => {
    setup()
    click(options()[0])
    click(options()[2], { ctrlKey: true })
    press('Enter')
    expect(onEdit).not.toHaveBeenCalled()
  })
})

describe('MacroPanel — deleting', () => {
  it('deletes the whole selection in one call, in list order', () => {
    setup()
    click(options()[2])
    click(options()[0], { ctrlKey: true })
    click(button('macroPanel.delete'))
    click(button('macroPanel.confirmDelete:2'))

    expect(deleteMacros).toHaveBeenCalledTimes(1)
    expect(deleteMacros).toHaveBeenCalledWith(['1', '3'])
  })

  it('deletes nothing until the confirmation is pressed', () => {
    setup()
    click(options()[0])
    click(button('macroPanel.delete'))
    expect(deleteMacros).not.toHaveBeenCalled()

    click(button('macroPanel.cancelDelete'))
    expect(deleteMacros).not.toHaveBeenCalled()
    expect(button('macroPanel.delete')).toBeInTheDocument()
  })

  it('arms the same confirmation from the Delete key rather than deleting outright', () => {
    // The key and the button have to mean the same thing, or the keyboard becomes the
    // unguarded way to destroy several macros at once.
    setup()
    click(options()[0])
    press('Delete')
    expect(deleteMacros).not.toHaveBeenCalled()
    expect(button('macroPanel.confirmDelete:1')).toBeInTheDocument()
  })

  it('stands the confirmation down when the selection changes under it', () => {
    setup()
    click(options()[0])
    click(button('macroPanel.delete'))
    expect(button('macroPanel.confirmDelete:1')).toBeInTheDocument()

    click(options()[1], { ctrlKey: true })
    // Otherwise the pending confirmation would apply to a selection nobody confirmed.
    expect(screen.queryByRole('button', { name: /confirmDelete/ })).not.toBeInTheDocument()
    expect(button('macroPanel.delete')).toBeInTheDocument()
  })

  it('does nothing on a delete request with an empty selection', () => {
    setup()
    press('Delete')
    expect(screen.queryByRole('button', { name: /confirmDelete/ })).not.toBeInTheDocument()
    expect(deleteMacros).not.toHaveBeenCalled()
  })
})

describe('MacroPanel — the selection after a delete', () => {
  it('drops the deleted macros from the count without being told to', () => {
    const { rerender } = setup()
    click(options()[0])
    click(options()[1], { ctrlKey: true })
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('macroPanel.selectedCount:2')

    // The store would push a shorter list; the selection is a subset of it, so it follows.
    rerender(
      <MacroPanel
        macros={[MACROS[2]]}
        onEdit={onEdit}
      />
    )
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('macroPanel.label')
  })
})
