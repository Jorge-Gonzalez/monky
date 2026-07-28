// Pattern: Store-Hook — the command-autocomplete behavior for the macro editor:
// "while typing a new command, find existing macros to load for editing." Kept
// out of ModalMacroForm so the form speaks only about editing a macro.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import type { Macro } from '../../../../types'
import { useMacroStore } from '../../../../store/useMacroStore'

const MAX_SUGGESTIONS = 5

/**
 * Focus stays on the command field for the whole interaction, so a second "current thing"
 * has to be carried alongside it rather than compete with it — the same lift that
 * aria-activedescendant makes in the accessibility tree.
 *
 * The layers nest: a list is open over the field, and a row may be armed within the list.
 * Enter and Escape then need no conditionals of their own — they act on the innermost
 * layer present, and Escape peels exactly one.
 */
export type SuggestionsState =
  | { layer: 'field' }
  | { layer: 'list'; active: number }
  | { layer: 'armed'; active: number; armedId: Macro['id'] }

/** -1: the list is open with nothing highlighted yet. */
const NONE = -1

// The modal renders inside a shadow root, where document.activeElement is the host rather
// than the focused field; the containing root has to be asked instead.
function containerHasFocus(container: HTMLElement): boolean {
  const root = container.getRootNode() as Document | ShadowRoot
  return container.contains(root.activeElement)
}

export function useCommandSuggestions(
  command: string,
  enabled: boolean,
  onLoad: (macro: Macro) => void,
  onDelete: (macro: Macro) => void
) {
  const macros = useMacroStore((s) => s.macros)
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<SuggestionsState>({ layer: 'field' })

  const suggestions = useMemo(() => {
    if (!enabled || !command.trim()) return []
    const q = command.toLowerCase()
    return macros.filter((m) => m.command.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS)
  }, [macros, command, enabled])

  const visible = state.layer !== 'field' && suggestions.length > 0
  const active = state.layer === 'field' ? NONE : state.active
  const armedId = state.layer === 'armed' ? state.armedId : null

  // Open is a property of the whole widget, not of the input. Closing on the input's own
  // blur meant that moving towards the row controls dismissed the thing being reached for.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onFocusIn = () => setState((s) => (s.layer === 'field' ? { layer: 'list', active: NONE } : s))
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null
      if (next && container.contains(next)) return
      setState({ layer: 'field' })
    }
    container.addEventListener('focusin', onFocusIn)
    container.addEventListener('focusout', onFocusOut)
    return () => {
      container.removeEventListener('focusin', onFocusIn)
      container.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  // Editing the command re-opens the list and drops any highlight or arming: the rows the
  // user was pointing at are not the rows they are looking at now. Re-opening is what makes
  // Escape a dismissal of the current list rather than a permanent one.
  useEffect(() => {
    const container = containerRef.current
    setState(container && containerHasFocus(container) ? { layer: 'list', active: NONE } : { layer: 'field' })
  }, [command])

  const arm = useCallback((macro: Macro) => {
    setState((s) => ({ layer: 'armed', active: s.layer === 'field' ? NONE : s.active, armedId: macro.id }))
  }, [])

  const disarm = useCallback(() => {
    setState((s) => (s.layer === 'armed' ? { layer: 'list', active: s.active } : s))
  }, [])

  const confirmDelete = useCallback(
    (macro: Macro) => {
      onDelete(macro)
      setState((s) => (s.layer === 'armed' ? { layer: 'list', active: NONE } : s))
    },
    [onDelete]
  )

  const select = useCallback(
    (macro: Macro) => {
      setState({ layer: 'field' })
      onLoad(macro)
    },
    [onLoad]
  )

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Innermost layer first: while a row is armed, Enter and Escape belong to it.
    if (state.layer === 'armed') {
      const armed = suggestions.find((m) => m.id === state.armedId)
      if (e.key === 'Enter' && armed) {
        e.preventDefault()
        e.stopPropagation()
        confirmDelete(armed)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        disarm()
        return
      }
    }

    if (!visible) return

    if (e.key === 'Escape') {
      e.stopPropagation()
      setState({ layer: 'field' })
      return
    }
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      setState({ layer: 'list', active: Math.min(active + 1, suggestions.length - 1) })
      return
    }
    if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault()
      setState({ layer: 'list', active: Math.max(active - 1, NONE) })
      return
    }
    // Shift rather than a bare Delete: the caret is live in the field, where Delete means
    // "remove the character to the right". Chrome and Firefox drop an address-bar
    // suggestion with Shift+Delete for the same reason.
    if (e.key === 'Delete' && e.shiftKey && active >= 0) {
      e.preventDefault()
      arm(suggestions[active])
      return
    }
    if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault()
        select(suggestions[active])
        return
      }
      const exact = suggestions.find((m) => m.command.toLowerCase() === command.toLowerCase())
      if (exact) {
        e.preventDefault()
        select(exact)
      } else {
        // No match: close and let Enter submit the form.
        setState({ layer: 'field' })
      }
    }
  }

  return {
    suggestions,
    visible,
    /** The row the field is pointing at; -1 when none. */
    activeIndex: active,
    /** The row awaiting confirmation, if any. */
    armedId,
    containerRef: containerRef as RefObject<HTMLDivElement>,
    select,
    arm,
    disarm,
    confirmDelete,
    inputProps: { onKeyDown },
  }
}
