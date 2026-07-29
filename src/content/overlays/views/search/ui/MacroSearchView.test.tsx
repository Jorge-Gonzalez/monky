// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MacroSearchView } from './MacroSearchView'
import { SEARCH_LISTBOX_ID, searchOptionId } from './SearchResultsPanel'
import { useMacroStore } from '../../../../../store/useMacroStore'

// The children, the navigation hooks, the keyboard hook, the query parser and the fuzzy
// search all run for real: the wiring between them is what this file tests. Only the
// edges are stubbed -- i18n, the store, and the crud call that would hit chrome.storage.
vi.mock('../../../../../lib/i18n', () => ({
  t: (key: string) => key,
}))

const mockMacros = [
  { id: 1, command: '/sig', text: 'My signature' },
  { id: 2, command: '/addr', text: 'My address' },
  { id: 3, command: '/brb', text: 'Be right back' },
]

vi.mock('../../../../../store/useMacroStore', () => ({
  useMacroStore: vi
    .fn()
    .mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ macros: mockMacros, config: { prefixes: ['/'] } })
    ),
}))

const mockDeleteMacro = vi.fn()
vi.mock('../../../../../store/macroCrud', () => ({
  deleteMacros: (ids: string[]) => mockDeleteMacro(ids),
}))

const props = () => ({
  onClose: vi.fn(),
  onViewChange: vi.fn(),
  onNavigateToEditor: vi.fn(),
  onSelectMacro: vi.fn(),
})

const input = () => screen.getByRole('combobox')
const options = () => Array.from(document.querySelectorAll('[role="option"]'))
const selectedOption = () => document.querySelector('[role="option"][aria-selected="true"]')

/** Type into the search box the way the user does, not by setting state. */
function type(value: string) {
  fireEvent.input(input(), { target: { value } })
}

/** useKeyboardNavigation listens on document in the capture phase, not on the input. */
function press(key: string) {
  fireEvent.keyDown(document, { key })
}

const useStore = (macros: unknown[], prefixes: string[]) =>
  vi
    .mocked(useMacroStore)
    .mockImplementation((selector: (s: unknown) => unknown) => selector({ macros, config: { prefixes } }))

describe('MacroSearchView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStore(mockMacros, ['/'])
  })

  describe('on mount', () => {
    it('focuses the search input', () => {
      render(<MacroSearchView {...props()} />)
      expect(document.activeElement).toBe(input())
    })

    it('lists every macro with nothing selected until the user types', () => {
      render(<MacroSearchView {...props()} />)
      // An empty query is not an empty result: useMacroSearch returns the whole set.
      expect(options()).toHaveLength(mockMacros.length)
      expect(selectedOption()).toBeNull()
      expect(input()).not.toHaveAttribute('aria-activedescendant')
    })

    it('shows the start-typing hint only when there are no macros at all', () => {
      useStore([], ['/'])
      render(<MacroSearchView {...props()} />)
      expect(screen.getByRole('status')).toHaveTextContent('modalSearch.startTypingHint')
      expect(screen.queryByRole('listbox')).toBeNull()
    })
  })

  describe('searching', () => {
    it('renders matches and auto-selects the first', () => {
      render(<MacroSearchView {...props()} />)
      type('s')
      expect(options().length).toBeGreaterThan(0)
      expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    })

    it('clears the selection when the query is emptied', () => {
      render(<MacroSearchView {...props()} />)
      type('sig')
      expect(selectedOption()).not.toBeNull()
      type('')
      expect(selectedOption()).toBeNull()
    })

    it('reports the result count in the footer', () => {
      render(<MacroSearchView {...props()} />)
      type('sig')
      expect(document.querySelector('[data-component="search-footer-count"]')?.textContent).toContain(
        'modalSearch.footer.macro'
      )
    })
  })

  describe('keyboard navigation', () => {
    it('moves the selection down and wraps past the last item', () => {
      render(<MacroSearchView {...props()} />)
      type('/')
      const count = options().length
      expect(count).toBeGreaterThan(1)
      press('ArrowDown')
      expect(options()[1]).toHaveAttribute('aria-selected', 'true')
      for (let i = 1; i < count; i++) press('ArrowDown')
      expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    })

    it('moves the selection up, wrapping to the last item', () => {
      render(<MacroSearchView {...props()} />)
      type('/')
      press('ArrowUp')
      expect(options().at(-1)).toHaveAttribute('aria-selected', 'true')
    })

    it('points aria-activedescendant at the selected option', () => {
      render(<MacroSearchView {...props()} />)
      type('/')
      expect(input()).toHaveAttribute('aria-controls', SEARCH_LISTBOX_ID)
      expect(input()).toHaveAttribute('aria-activedescendant', searchOptionId(0))
      press('ArrowDown')
      expect(input()).toHaveAttribute('aria-activedescendant', searchOptionId(1))
      expect(selectedOption()?.id).toBe(searchOptionId(1))
    })

    it('closes on Escape', () => {
      const p = props()
      render(<MacroSearchView {...p} />)
      press('Escape')
      expect(p.onClose).toHaveBeenCalled()
    })
  })

  describe('command mode', () => {
    it('switches to command discovery on ":" and counts commands, not macros', () => {
      render(<MacroSearchView {...props()} />)
      type(':')
      expect(screen.getByText(':new')).toBeInTheDocument()
      expect(screen.getByText(':settings')).toBeInTheDocument()
      expect(document.querySelector('[data-component="search-footer-count"]')?.textContent).toContain(
        'modalSearch.footer.commands'
      )
    })

    it('does not carry a stale selection across a mode change', () => {
      render(<MacroSearchView {...props()} />)
      type('/')
      press('ArrowDown')
      press('ArrowDown')
      expect(options()[2]).toHaveAttribute('aria-selected', 'true')
      // Through a mode with no options at all, then back to one with results.
      type(':delete')
      expect(options()).toHaveLength(0)
      type(':delete/')
      expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    })

    // A prefixes change from another surface (popup, options page) is the only way the
    // mode can switch while the query stays exactly as typed, so it is the one case the
    // disabled mode-reset effect could have been the sole actor for.
    it('drops a stale selection when a prefixes change flips the mode and back', () => {
      const { rerender } = render(<MacroSearchView {...props()} />)
      type(':delete/')
      press('ArrowDown')
      press('ArrowDown')
      expect(options()[2]).toHaveAttribute('aria-selected', 'true')

      // '/' is no longer a prefix, so the command falls back to awaiting its argument.
      useStore(mockMacros, [';'])
      rerender(<MacroSearchView {...props()} />)
      expect(screen.getByRole('status')).toHaveTextContent('modalSearch.awaitingHint')
      expect(options()).toHaveLength(0)

      // Back to a list of results: the selection starts over rather than resuming at 2.
      useStore(mockMacros, ['/'])
      rerender(<MacroSearchView {...props()} />)
      expect(options()).toHaveLength(mockMacros.length)
      expect(options()[0]).toHaveAttribute('aria-selected', 'true')
      expect(input()).toHaveAttribute('aria-activedescendant', searchOptionId(0))
    })

    it('shows the awaiting hint for a parametric command with no argument', () => {
      render(<MacroSearchView {...props()} />)
      type(':delete')
      expect(screen.getByRole('status')).toHaveTextContent('modalSearch.awaitingHint')
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('filters macros by the parameter once one is given', () => {
      render(<MacroSearchView {...props()} />)
      type(':delete/sig')
      expect(screen.getByText('/sig')).toBeInTheDocument()
      expect(screen.queryByText('/addr')).toBeNull()
    })
  })

  describe('selecting', () => {
    it('hands the chosen macro back and closes', () => {
      const p = props()
      render(<MacroSearchView {...p} />)
      type('sig')
      press('Enter')
      expect(p.onSelectMacro).toHaveBeenCalledWith(expect.objectContaining({ command: '/sig' }))
      expect(p.onClose).toHaveBeenCalled()
    })

    it('opens the editor on Tab with a selection', () => {
      const p = props()
      render(<MacroSearchView {...p} />)
      type('sig')
      press('Tab')
      expect(p.onNavigateToEditor).toHaveBeenCalledWith(expect.objectContaining({ command: '/sig' }))
    })
  })

  describe('two-step delete', () => {
    it('arms the row on the first Enter and deletes on the second', () => {
      render(<MacroSearchView {...props()} />)
      type(':delete/sig')
      press('Enter')
      expect(selectedOption()).toHaveAttribute('data-state', 'confirming-delete')
      expect(mockDeleteMacro).not.toHaveBeenCalled()
      press('Enter')
      expect(mockDeleteMacro).toHaveBeenCalledWith(['1'])
    })

    it('disarms when the query changes', () => {
      render(<MacroSearchView {...props()} />)
      type(':delete/sig')
      press('Enter')
      expect(selectedOption()).toHaveAttribute('data-state', 'confirming-delete')
      type(':delete/si')
      expect(document.querySelector('[data-state="confirming-delete"]')).toBeNull()
      expect(mockDeleteMacro).not.toHaveBeenCalled()
    })
  })
})
