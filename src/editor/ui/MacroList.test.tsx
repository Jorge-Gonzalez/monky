// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useMemo } from 'react'
import type { Macro } from '../../types'
import { useListSelection } from '../../shared/useListSelection'
import { MacroList } from './MacroList'

vi.mock('../../lib/i18n', () => ({ t: (key: string) => key }))

const MACROS: Macro[] = [
  { id: '1', command: '/a', text: 'Alpha', contentType: 'text/plain' },
  { id: '2', command: '/b', text: 'Bravo', contentType: 'text/plain' },
  { id: '3', command: '/c', text: 'Charlie', contentType: 'text/plain' },
  { id: '4', command: '/d', text: 'Delta', contentType: 'text/plain' },
]

const onEditRequest = vi.fn()
const onDeleteRequest = vi.fn()

// The list owns no selection, so a host supplies one the way MacroPanel does. Going through a
// host rather than driving the hook from outside matters: it re-renders on every state change,
// which is the cadence a keypress actually sees.
function Host({ macros }: { macros: Macro[] }) {
  const ids = useMemo(() => macros.map((m) => m.id), [macros])
  const selection = useListSelection(ids)
  return (
    <MacroList
      macros={macros}
      selection={selection}
      onEditRequest={onEditRequest}
      onDeleteRequest={onDeleteRequest}
    />
  )
}

const setup = (macros: Macro[] = MACROS) => render(<Host macros={macros} />)

const listbox = () => screen.getByRole('listbox')
const options = () => screen.getAllByRole('option')
const selected = () =>
  options()
    .filter((o) => o.getAttribute('aria-selected') === 'true')
    .map((o) => o.textContent?.match(/\/[a-z]/)?.[0])

const press = (key: string, mods: Record<string, boolean> = {}) => {
  void act(() => {
    fireEvent.keyDown(listbox(), { key, ...mods })
  })
}
const click = (index: number, mods: Record<string, boolean> = {}) => {
  void act(() => {
    fireEvent.click(options()[index], mods)
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MacroList — structure', () => {
  it('is a multi-selectable listbox of options', () => {
    setup()
    expect(listbox()).toHaveAttribute('aria-multiselectable', 'true')
    expect(options()).toHaveLength(4)
  })

  it('is a single tab stop that points at the lead through aria-activedescendant', () => {
    setup()
    expect(listbox()).toHaveAttribute('tabindex', '0')
    expect(listbox()).not.toHaveAttribute('aria-activedescendant')

    click(2)
    expect(listbox()).toHaveAttribute('aria-activedescendant', options()[2].id)
  })

  it('puts no focusable control inside an option', () => {
    // ARIA makes an option's descendants presentational, so anything focusable in there reads
    // as nothing while still taking a tab stop -- the aria-hidden-focus violation that the
    // search row's edit button ran into. The selection indicator has to stay a drawing.
    setup()
    for (const option of options()) {
      expect(option.querySelectorAll('button, input, a, [tabindex]')).toHaveLength(0)
    }
  })

  it('shows the empty state instead of an empty listbox', () => {
    setup([])
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByText('macroPanel.empty')).toBeInTheDocument()
  })
})

describe('MacroList — pointer selection', () => {
  it('replaces the selection on a plain click', () => {
    setup()
    click(1)
    expect(selected()).toEqual(['/b'])
    click(3)
    expect(selected()).toEqual(['/d'])
  })

  it('adds to the selection on a Ctrl or Cmd click', () => {
    setup()
    click(0)
    click(2, { ctrlKey: true })
    expect(selected()).toEqual(['/a', '/c'])
    click(3, { metaKey: true })
    expect(selected()).toEqual(['/a', '/c', '/d'])
  })

  it('removes an already-selected row on a Ctrl click', () => {
    setup()
    click(0)
    click(2, { ctrlKey: true })
    click(0, { ctrlKey: true })
    expect(selected()).toEqual(['/c'])
  })

  it('selects the run between anchor and target on a Shift click', () => {
    setup()
    click(0)
    click(2, { shiftKey: true })
    expect(selected()).toEqual(['/a', '/b', '/c'])
  })
})

describe('MacroList — coarse pointer', () => {
  const original = window.matchMedia

  beforeEach(() => {
    window.matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = original
  })

  it('toggles on an unmodified tap instead of replacing', () => {
    // There are no modifier keys on a touch screen, so if a bare tap replaced the selection a
    // second tap would discard the first and multi-select would be unreachable. Apple, Material
    // and React Aria all degrade to toggle here for the same reason.
    setup()
    click(0)
    click(2)
    expect(selected()).toEqual(['/a', '/c'])

    click(0)
    expect(selected()).toEqual(['/c'])
  })

  it('still honours Shift, for a tablet with a keyboard', () => {
    setup()
    click(0)
    click(2, { shiftKey: true })
    expect(selected()).toEqual(['/a', '/b', '/c'])
  })
})

describe('MacroList — keyboard', () => {
  it('moves the selection with the arrows, clamped at both ends', () => {
    setup()
    press('ArrowDown')
    expect(selected()).toEqual(['/a'])

    // Clamped rather than wrapped: a selection that jumps the whole list on one keypress is
    // how a range gets extended over everything by accident.
    press('ArrowUp')
    expect(selected()).toEqual(['/a'])

    press('End')
    expect(selected()).toEqual(['/d'])
    press('ArrowDown')
    expect(selected()).toEqual(['/d'])
  })

  it('enters at the last row when Up is pressed with nothing selected', () => {
    setup()
    press('ArrowUp')
    expect(selected()).toEqual(['/d'])
  })

  it('extends with Shift and the arrows, and shrinks back', () => {
    setup()
    press('Home')
    press('ArrowDown', { shiftKey: true })
    press('ArrowDown', { shiftKey: true })
    expect(selected()).toEqual(['/a', '/b', '/c'])

    press('ArrowUp', { shiftKey: true })
    expect(selected()).toEqual(['/a', '/b'])
  })

  it('moves the lead alone under Ctrl, leaving the selection where it was', () => {
    setup()
    press('Home')
    expect(selected()).toEqual(['/a'])

    press('ArrowDown', { ctrlKey: true })
    press('ArrowDown', { ctrlKey: true })
    expect(selected()).toEqual(['/a'])
    expect(listbox()).toHaveAttribute('aria-activedescendant', options()[2].id)
  })

  it('toggles the lead row with Space', () => {
    setup()
    press('Home')
    press('ArrowDown', { ctrlKey: true })
    press(' ')
    expect(selected()).toEqual(['/a', '/b'])

    press(' ')
    expect(selected()).toEqual(['/a'])
  })

  it('selects every row with Ctrl+A and clears with Escape', () => {
    setup()
    press('a', { ctrlKey: true })
    expect(selected()).toEqual(['/a', '/b', '/c', '/d'])

    press('Escape')
    expect(selected()).toEqual([])
  })

  it('leaves a plain "a" keypress alone', () => {
    setup()
    press('a')
    expect(selected()).toEqual([])
  })

  it('asks for edit on Enter and for delete on Delete or Backspace', () => {
    setup()
    press('Enter')
    expect(onEditRequest).toHaveBeenCalledTimes(1)

    press('Delete')
    expect(onDeleteRequest).toHaveBeenCalledTimes(1)
    press('Backspace')
    expect(onDeleteRequest).toHaveBeenCalledTimes(2)
  })
})
