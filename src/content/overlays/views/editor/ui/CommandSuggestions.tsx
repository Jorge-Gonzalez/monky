import type { Macro } from '../../../../../types'
import { t } from '../../../../../lib/i18n'

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M9 14H5c-.5 0-1-.5-1-1V7H3c0 0 0 6 0 6 0 1.2.8 2 2 2h4v-1z" />
    <path d="M7 14h4c.5 0 1-.5 1-1V7h1c0 0 0 6 0 6 0 1.2-.8 2-2 2H7v-1z" />
    <path d="M6 7c0-.7 1-.7 1 0v5c0 .7-1 .7-1 0V7z" />
    <path d="M9 7c0-.7 1-.7 1 0v5c0 .7-1 .7-1 0V7z" />
    <path d="M14 4h-3V3c0-1.2-.8-2-2-2H7c-1.2 0-2 .8-2 2v1H2c-.7 0-.7 1 0 1h12c.7 0 .7-1 0-1zm-4 0H6V3c0-.7.4-1 1-1h2c.6 0 1 .3 1 1v1z" />
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
  </svg>
)

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
  </svg>
)

/** The listbox the command input points at with aria-controls. */
export const SUGGESTIONS_LISTBOX_ID = 'monky-command-suggestions'

/** Options are addressed by position, so the input can name the active one from its index. */
export const suggestionOptionId = (index: number) => `${SUGGESTIONS_LISTBOX_ID}-option-${index}`

const SUGGESTIONS_LABEL_ID = `${SUGGESTIONS_LISTBOX_ID}-label`

interface CommandSuggestionsProps {
  suggestions: Macro[]
  /** The row the field points at, carried alongside focus rather than holding it. */
  activeIndex: number
  /** The row awaiting confirmation, if any. */
  armedId: Macro['id'] | null
  onSelect: (macro: Macro) => void
  onArm: (macro: Macro) => void
  onConfirmDelete: (macro: Macro) => void
  onDisarm: () => void
}

/**
 * CommandSuggestions - the dropdown of existing macros matching the typed command.
 * Each row can be loaded for editing (select) or deleted via an inline two-step:
 * the trash icon arms the row, then a confirm (check) deletes / cancel (x) backs out.
 *
 * The component holds no state: which row is current and which is armed both belong to
 * useCommandSuggestions, because Enter and Escape have to dispatch on the innermost of
 * those layers and the key handler lives there. Every control here has a keyboard
 * equivalent on the field — Shift+Delete arms, Enter confirms, Escape disarms.
 */
export function CommandSuggestions({
  suggestions,
  activeIndex,
  armedId,
  onSelect,
  onArm,
  onConfirmDelete,
  onDisarm,
}: CommandSuggestionsProps) {
  return (
    <div data-component="editor-suggestions" className="hidden attach-below stretch-inline
      dropdown position-absolute
      ground-subtle rule-accent-soft corner-bottom-md ruled-bottom ruled-left ruled-right elevated">
      <div id={SUGGESTIONS_LABEL_ID} data-component="editor-suggestions-label" className="padding-block-xs padding-inline-md
        ink-soft rule ruled-bottom font-sm">
        {t('editor.commandSuggestionsLabel')}
      </div>
      {/* The listbox wraps the rows only. A listbox may contain nothing but options, so the
          heading above names it through aria-labelledby instead of sitting inside it. */}
      <div id={SUGGESTIONS_LISTBOX_ID} role="listbox" aria-labelledby={SUGGESTIONS_LABEL_ID}>
      {suggestions.map((macro, i) => {
        const confirming = macro.id === armedId
        return (
          <div
            key={macro.id}
            id={suggestionOptionId(i)}
            role="option"
            data-component="editor-suggestions-item"
            className={`horizontal gap-md padding-block-sm padding-inline-md align-center hidden tween-ground-quick pressable ${confirming ? 'ground-fail-faint' : 'selectable hover:ground selected:ground-defined'}`}
            aria-selected={i === activeIndex ? 'true' : 'false'}
            data-state={confirming ? 'confirming-delete' : undefined}
            onMouseDown={e => { e.preventDefault(); onSelect(macro) }}
          >
            <span data-component="editor-suggestions-item-command" className="rigid
              ink-accent font-md font-medium text-nowrap">{macro.command}</span>
            <span data-component="editor-suggestions-item-text" className="hidden
              ink-soft font-sm truncate">{macro.text}</span>
            {/* Pointer affordances. A listbox option makes its descendants presentational,
                so these cannot be exposed here whatever we do; the keyboard path is on the
                field instead, which is where focus is. */}
            {confirming ? (
              <span aria-hidden="true" className="horizontal rigid gap-xs push align-center">
                <button
                  type="button"
                  tabIndex={-1}
                  data-component="editor-suggestions-item-confirm"
                  className="horizontal rigid padding-xs align-center justify-center
                    tween-opacity-ground-ink-quick
                    ink-fail corner-sm pressable
                    hover:ground-fail hover:ink-inverse"
                  aria-label={t('editor.confirmDelete')}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onConfirmDelete(macro) }}
                >
                  <CheckIcon />
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  data-component="editor-suggestions-item-cancel"
                  className="horizontal rigid padding-xs align-center justify-center
                    tween-opacity-ground-ink-quick
                    ink-soft corner-sm pressable
                    hover:ground-defined hover:ink"
                  aria-label={t('editor.cancelDelete')}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onDisarm() }}
                >
                  <CloseIcon />
                </button>
              </span>
            ) : (
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                data-component="editor-suggestions-item-delete"
                className="horizontal rigid padding-xs push align-center justify-center
                  tween-opacity-ground-ink-quick
                  ink-soft corner-sm pressable concealed
                  hover:ground-fail-faint hover:ink-fail
                  parent-hover:revealed
                  parent-selected:revealed"
                aria-label={t('editor.deleteMacro')}
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onArm(macro) }}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}
