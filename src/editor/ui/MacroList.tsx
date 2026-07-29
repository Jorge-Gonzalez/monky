// The macro list on the editor page: a multi-select listbox, and the only place the page
// decides which macros the toolbar acts on.
//
// The selection indicator is drawn, not a real checkbox. ARIA makes an option's descendants
// presentational, so an `<input type="checkbox">` in here would lose its role and read as
// nothing while still being focusable -- the aria-hidden-focus shape that bit the search row's
// edit button. `aria-selected` on the option is what actually carries the state to assistive
// tech; the box is there so a sighted user can see that selecting several is possible at all.
import { useEffect, useRef } from 'react'
import type { JSX } from 'preact'
import type { Macro } from '../../types'
import { t } from '../../lib/i18n'
import type { ListSelection } from '../../shared/useListSelection'
import { selectionIntent } from '../../shared/useListSelection'
import { useCoarsePointer } from '../../shared/useCoarsePointer'

export const MACRO_LISTBOX_ID = 'macro-list'
export const macroOptionId = (index: number) => `macro-option-${index}`

const CheckMark = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m5 13 4 4L19 7"
    />
  </svg>
)

interface MacroListProps {
  macros: Macro[]
  selection: ListSelection<Macro['id']>
  /** Enter on the list, mirroring the toolbar's primary action. */
  onEditRequest: () => void
  /** Delete or Backspace on the list, mirroring the toolbar's destructive action. */
  onDeleteRequest: () => void
}

export function MacroList({ macros, selection, onEditRequest, onDeleteRequest }: MacroListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const coarsePointer = useCoarsePointer()
  const ids = macros.map((m) => m.id)
  const leadIndex = selection.lead !== null ? ids.indexOf(selection.lead) : -1

  // Keep the lead row in view when the keyboard moves it past either edge of the scroll box.
  useEffect(() => {
    listRef.current?.querySelector('[data-lead="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [leadIndex])

  const apply = (index: number, intent: ReturnType<typeof selectionIntent>) => {
    const id = ids[index]
    if (id === undefined) return
    if (intent === 'extend') selection.extend(id)
    else if (intent === 'toggle') selection.toggle(id)
    else selection.replace(id)
  }

  const onKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
    // Arrows move selection with it (APG's "selection follows focus"), except under Ctrl,
    // which walks the lead alone so a row can be reached without disturbing the selection.
    const step = (to: number) => {
      event.preventDefault()
      const index = Math.max(0, Math.min(macros.length - 1, to))
      if (event.ctrlKey || event.metaKey) {
        const id = ids[index]
        if (id !== undefined) selection.moveLead(id)
        return
      }
      apply(index, event.shiftKey ? 'extend' : 'replace')
    }

    switch (event.key) {
      case 'ArrowDown':
        return step(leadIndex + 1)
      case 'ArrowUp':
        // From nowhere, Up enters at the end -- the only place wrapping makes sense, since
        // there is no lead yet to move away from.
        return step(leadIndex < 0 ? macros.length - 1 : leadIndex - 1)
      case 'Home':
        return step(0)
      case 'End':
        return step(macros.length - 1)
      case ' ':
        event.preventDefault()
        if (leadIndex >= 0) apply(leadIndex, 'toggle')
        return
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          selection.selectAll()
        }
        return
      case 'Escape':
        // Material names the two ways out of a selection: unpick every row, or act on it from
        // the toolbar. Escape is the third, and the only one that costs a single keystroke.
        selection.clear()
        return
      case 'Enter':
        event.preventDefault()
        onEditRequest()
        return
      case 'Delete':
      case 'Backspace':
        event.preventDefault()
        onDeleteRequest()
        return
      default:
        return
    }
  }

  if (macros.length === 0) {
    return (
      <div
        data-component="macro-list-empty"
        className="padding-lg
          ink-soft font-md text-center"
        role="status"
      >
        {t('macroPanel.empty')}
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      id={MACRO_LISTBOX_ID}
      data-component="macro-list"
      className="vertical elastic gap-xs padding-xs scroll-auto max-height-results-md min-height-none
        ground rule corner-lg ruled scrollbar-subtle
        focus:ring-accent-soft"
      role="listbox"
      aria-multiselectable
      aria-label={t('macroPanel.label')}
      aria-activedescendant={leadIndex >= 0 ? macroOptionId(leadIndex) : undefined}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {macros.map((macro, index) => (
        <MacroOption
          key={macro.id}
          optionId={macroOptionId(index)}
          macro={macro}
          isSelected={selection.isSelected(macro.id)}
          isLead={index === leadIndex}
          onPick={(event) => apply(index, selectionIntent(event, coarsePointer))}
        />
      ))}
    </div>
  )
}

interface MacroOptionProps {
  optionId: string
  macro: Macro
  isSelected: boolean
  isLead: boolean
  onPick: (event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) => void
}

function MacroOption({ optionId, macro, isSelected, isLead, onPick }: MacroOptionProps) {
  return (
    <div
      id={optionId}
      data-component="macro-option"
      className="horizontal gap-sm padding-block-sm padding-inline-sm align-center
        tween-ground-quick
        selectable
        corner-md
        hover:ground-subtle
        selected:ground-defined"
      role="option"
      aria-selected={isSelected}
      data-lead={isLead || undefined}
      onClick={(event) => {
        onPick(event)
      }}
    >
      <span
        data-component="macro-option-mark"
        className="horizontal rigid align-center justify-center control-box-lg
          tween-ground-quick
          ink-inverse rule corner-sm ruled
          parent-selected:ground-accent parent-selected:rule-accent"
      >
        {isSelected && <CheckMark />}
      </span>
      <span
        data-component="macro-option-command"
        className="rigid max-width-command
          ink-accent font-md font-semibold font-mono truncate"
      >
        {macro.command}
      </span>
      <span
        data-component="macro-option-text"
        className="elastic basis-ratio min-width-none
          ink-soft font-sm truncate"
      >
        {macro.text}
      </span>
    </div>
  )
}
