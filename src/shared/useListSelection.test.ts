// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/preact'
import { describe, it, expect } from 'vitest'
import { useListSelection, selectionIntent } from './useListSelection'

const IDS = ['a', 'b', 'c', 'd', 'e']

const render = (ids: readonly string[] = IDS) => renderHook(() => useListSelection(ids))
const sel = (result: { current: { selected: ReadonlySet<string> } }) => [...result.current.selected]

describe('useListSelection — replace', () => {
  it('starts with nothing selected and no lead', () => {
    const { result } = render()
    expect(sel(result)).toEqual([])
    expect(result.current.lead).toBeNull()
  })

  it('selects exactly one item, discarding whatever was selected before', () => {
    const { result } = render()
    void act(() => result.current.toggle('a'))
    void act(() => result.current.toggle('c'))
    expect(sel(result)).toEqual(['a', 'c'])

    void act(() => result.current.replace('e'))
    expect(sel(result)).toEqual(['e'])
    expect(result.current.lead).toBe('e')
  })
})

describe('useListSelection — toggle', () => {
  it('adds an unselected item and removes a selected one', () => {
    const { result } = render()
    void act(() => result.current.toggle('b'))
    expect(result.current.isSelected('b')).toBe(true)
    void act(() => result.current.toggle('b'))
    expect(result.current.isSelected('b')).toBe(false)
  })

  it('reports the selection in list order, not in the order the items were picked', () => {
    const { result } = render()
    void act(() => result.current.toggle('d'))
    void act(() => result.current.toggle('a'))
    void act(() => result.current.toggle('c'))
    expect(sel(result)).toEqual(['a', 'c', 'd'])
  })

  it('leaves the rest of the selection alone', () => {
    const { result } = render()
    void act(() => result.current.toggle('a'))
    void act(() => result.current.toggle('c'))
    void act(() => result.current.toggle('a'))
    expect(sel(result)).toEqual(['c'])
  })
})

describe('useListSelection — extend', () => {
  it('selects the range between the anchor and the target, in either direction', () => {
    const { result } = render()
    void act(() => result.current.replace('b'))
    void act(() => result.current.extend('d'))
    expect(sel(result)).toEqual(['b', 'c', 'd'])

    // Backwards from the same anchor: the anchor does not move, so the range re-forms
    // upwards rather than measuring from the previous end.
    void act(() => result.current.extend('a'))
    expect(sel(result)).toEqual(['a', 'b'])
  })

  it('keeps the anchor across repeated extends so the range grows and shrinks', () => {
    const { result } = render()
    void act(() => result.current.replace('a'))
    void act(() => result.current.extend('e'))
    expect(sel(result)).toEqual(IDS)
    void act(() => result.current.extend('b'))
    expect(sel(result)).toEqual(['a', 'b'])
  })

  it('replaces islands added by toggle, as desktop file managers do', () => {
    const { result } = render()
    void act(() => result.current.toggle('a'))
    void act(() => result.current.toggle('d'))
    // The anchor followed the last toggle, so the range runs from 'd'.
    void act(() => result.current.extend('e'))
    expect(sel(result)).toEqual(['d', 'e'])
  })

  it('selects only the target when there is no anchor to range from', () => {
    const { result } = render()
    void act(() => result.current.extend('c'))
    expect(sel(result)).toEqual(['c'])
    expect(result.current.lead).toBe('c')
  })

  it('ignores a target that is not in the list', () => {
    const { result } = render()
    void act(() => result.current.replace('b'))
    void act(() => result.current.extend('zzz'))
    expect(sel(result)).toEqual(['b'])
  })
})

describe('useListSelection — lead', () => {
  it('moves without changing the selection', () => {
    const { result } = render()
    void act(() => result.current.replace('b'))
    void act(() => result.current.moveLead('d'))
    expect(result.current.lead).toBe('d')
    expect(sel(result)).toEqual(['b'])
  })

  it('ranges from the anchor, not from the moved lead', () => {
    const { result } = render()
    void act(() => result.current.replace('a'))
    void act(() => result.current.moveLead('d'))
    void act(() => result.current.extend('c'))
    expect(sel(result)).toEqual(['a', 'b', 'c'])
  })
})

describe('useListSelection — items leaving the list', () => {
  it('drops deleted ids from the selection on the same render', () => {
    const { result, rerender } = renderHook(({ ids }: { ids: readonly string[] }) => useListSelection(ids), {
      initialProps: { ids: IDS },
    })
    void act(() => result.current.replace('b'))
    void act(() => result.current.extend('d'))
    expect(result.current.selected.size).toBe(3)

    rerender({ ids: ['a', 'c', 'e'] })
    // No intermediate render reports 3 -- the toolbar reads this size to decide whether Edit
    // is enabled, so a stale count would enable it for a macro that no longer exists.
    expect(sel(result)).toEqual(['c'])
  })

  it('clears the lead when the led item is deleted', () => {
    const { result, rerender } = renderHook(({ ids }: { ids: readonly string[] }) => useListSelection(ids), {
      initialProps: { ids: IDS },
    })
    void act(() => result.current.replace('d'))
    rerender({ ids: ['a', 'b', 'c'] })
    expect(result.current.lead).toBeNull()
  })

  it('ranges over the current list after a reorder', () => {
    const { result, rerender } = renderHook(({ ids }: { ids: readonly string[] }) => useListSelection(ids), {
      initialProps: { ids: IDS },
    })
    void act(() => result.current.replace('a'))
    rerender({ ids: ['e', 'd', 'c', 'b', 'a'] })
    void act(() => result.current.extend('c'))
    expect(sel(result)).toEqual(['c', 'b', 'a'])
  })
})

describe('useListSelection — clear and selectAll', () => {
  it('clears the selection, the anchor and the lead', () => {
    const { result } = render()
    void act(() => result.current.replace('b'))
    void act(() => result.current.clear())
    expect(sel(result)).toEqual([])
    expect(result.current.lead).toBeNull()
    // The anchor is gone too, so the next extend cannot range from it.
    void act(() => result.current.extend('d'))
    expect(sel(result)).toEqual(['d'])
  })

  it('selects every item and leaves a range spanning the list', () => {
    const { result } = render()
    void act(() => result.current.selectAll())
    expect(sel(result)).toEqual(IDS)
    expect(result.current.lead).toBe('e')
    void act(() => result.current.extend('c'))
    expect(sel(result)).toEqual(['a', 'b', 'c'])
  })

  it('does nothing on an empty list', () => {
    const { result } = render([])
    void act(() => result.current.selectAll())
    expect(sel(result)).toEqual([])
    expect(result.current.lead).toBeNull()
  })
})

describe('selectionIntent', () => {
  const none = { shiftKey: false, ctrlKey: false, metaKey: false }

  it('reads an unmodified click as replace', () => {
    expect(selectionIntent(none)).toBe('replace')
  })

  it('reads Ctrl and Cmd as toggle', () => {
    expect(selectionIntent({ ...none, ctrlKey: true })).toBe('toggle')
    expect(selectionIntent({ ...none, metaKey: true })).toBe('toggle')
  })

  it('reads Shift as extend, ahead of Ctrl and Cmd', () => {
    expect(selectionIntent({ ...none, shiftKey: true })).toBe('extend')
    expect(selectionIntent({ shiftKey: true, ctrlKey: true, metaKey: true })).toBe('extend')
  })

  it('reads an unmodified tap on a coarse pointer as toggle, not replace', () => {
    expect(selectionIntent(none, true)).toBe('toggle')
  })

  it('still honours modifiers on a coarse pointer, for a tablet with a keyboard', () => {
    expect(selectionIntent({ ...none, shiftKey: true }, true)).toBe('extend')
  })
})
