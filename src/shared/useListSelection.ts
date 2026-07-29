// A list's selection state: which items are selected, and the two positions a range needs.
//
// The model is `{ selected, anchor, lead }`, which is what Swing's ListSelectionModel named
// decades ago and what every pointer-plus-modifier list has used since: the anchor is where a
// range starts, the lead is where it currently ends. Three operations move them --
//
//   replace  plain click, plain arrow key   selection becomes just this item
//   toggle   Ctrl/Cmd+click, or any tap     flip this item, leave the rest alone
//   extend   Shift+click, Shift+arrow       selection becomes anchor..this item
//
// -- which is APG's "Alternative" selection model, and what React Aria calls
// `selectionBehavior: 'replace'`. Touch has no equivalent: Apple, Material and React Aria all
// degrade to toggle there, because a drag gesture gives a path rather than two endpoints, so
// there is nothing for an anchor to be. `extend` is therefore modifier-only by nature, not by
// omission.
//
// The one invariant is that the selection is a subset of `ids`. It holds on write as well as
// on read, so there is no memory of ids that have left the list and nothing can reappear if
// the list grows back. That is not a limitation to work around: `ids` is the whole list as far
// as this hook can see, and it is never handed anything wider, so every operation is fully
// defined over it. A second tier for "selected but not currently listed" would be the thing
// that made `replace` and `selectAll` ambiguous, not the thing that resolved them.
//
// Nothing here touches the DOM or reads an event. Callers decide which operation an
// interaction means; see `selectionIntent`.
import { useCallback, useMemo, useState } from 'react'

export interface ListSelection<Id> {
  /** The selected ids, in list order, pruned to those still present in the list. */
  selected: ReadonlySet<Id>
  /** Where a range currently ends -- the roving position, for `aria-activedescendant`. */
  lead: Id | null
  isSelected: (id: Id) => boolean
  replace: (id: Id) => void
  toggle: (id: Id) => void
  extend: (id: Id) => void
  /** Move the lead without changing the selection (Ctrl+arrow). */
  moveLead: (id: Id) => void
  clear: () => void
  selectAll: () => void
}

interface SelectionState<Id> {
  selected: ReadonlySet<Id>
  anchor: Id | null
  lead: Id | null
}

const empty = <Id>(): SelectionState<Id> => ({ selected: new Set<Id>(), anchor: null, lead: null })

export function useListSelection<Id>(ids: readonly Id[]): ListSelection<Id> {
  const [state, setState] = useState<SelectionState<Id>>(empty<Id>)

  // Ids that have left the list are dropped on read rather than pruned by an effect. An
  // effect would leave one render reporting a size that includes items no longer there --
  // and the toolbar decides whether Edit is enabled from exactly that number.
  const present = useMemo(() => new Set(ids), [ids])
  // Built by walking the list rather than the selection, so iteration order is list order
  // whichever way the items were picked. Callers that act on a multiple selection -- deleting
  // several macros -- then see them in the order they appear on screen.
  const selected = useMemo(() => new Set(ids.filter((id) => state.selected.has(id))), [state.selected, ids])
  const lead = state.lead !== null && present.has(state.lead) ? state.lead : null

  const replace = useCallback(
    (id: Id) => {
      if (!present.has(id)) return
      setState({ selected: new Set([id]), anchor: id, lead: id })
    },
    [present]
  )

  const toggle = useCallback(
    (id: Id) => {
      setState((prev) => {
        if (!present.has(id)) return prev
        // Normalised against the list on write, like the other three operations, so the
        // invariant `selection is a subset of ids` holds in the stored state and not only in
        // the derived view. Copying `prev.selected` wholesale would carry ids that have left
        // the list, and they would reappear if it ever grew back.
        const next = new Set(ids.filter((candidate) => prev.selected.has(candidate)))
        if (!next.delete(id)) next.add(id)
        // The anchor follows a toggle, so a Shift that comes next ranges from here.
        return { selected: next, anchor: id, lead: id }
      })
    },
    [ids, present]
  )

  const extend = useCallback(
    (id: Id) => {
      setState((prev) => {
        const from = prev.anchor !== null ? ids.indexOf(prev.anchor) : -1
        const to = ids.indexOf(id)
        if (to < 0) return prev
        // With no anchor to range from -- nothing selected yet, or the anchor was deleted --
        // Shift+click can only mean "select this one".
        if (from < 0) return { selected: new Set([id]), anchor: id, lead: id }
        const [lo, hi] = from <= to ? [from, to] : [to, from]
        // The range replaces the selection: islands added with Ctrl are lost, as they are in
        // every desktop file manager. Ctrl+Shift, which would add a range instead, is not
        // implemented.
        return { selected: new Set(ids.slice(lo, hi + 1)), anchor: prev.anchor, lead: id }
      })
    },
    [ids]
  )

  const moveLead = useCallback((id: Id) => {
    setState((prev) => ({ ...prev, lead: id }))
  }, [])

  const clear = useCallback(() => {
    setState(empty<Id>())
  }, [])

  const selectAll = useCallback(() => {
    if (ids.length === 0) return
    setState({ selected: new Set(ids), anchor: ids[0], lead: ids[ids.length - 1] })
  }, [ids])

  const isSelected = useCallback((id: Id) => selected.has(id), [selected])

  return { selected, lead, isSelected, replace, toggle, extend, moveLead, clear, selectAll }
}

/** Which operation a click or keypress means, given its modifiers. */
export type SelectionIntent = 'replace' | 'toggle' | 'extend'

interface IntentModifiers {
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
}

/**
 * Map an interaction's modifiers onto an operation. `coarsePointer` covers touch, where no
 * modifiers exist and an unmodified tap has to mean toggle -- otherwise a second tap would
 * throw the first selection away and multi-select would be unreachable.
 */
export function selectionIntent(mods: IntentModifiers, coarsePointer = false): SelectionIntent {
  if (mods.shiftKey) return 'extend'
  if (mods.ctrlKey || mods.metaKey) return 'toggle'
  return coarsePointer ? 'toggle' : 'replace'
}
