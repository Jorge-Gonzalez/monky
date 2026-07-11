import { useEffect, useState } from 'react';
import { Macro } from '../../../../../types';
import { t } from '../../../../../lib/i18n';

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M9 14H5c-.5 0-1-.5-1-1V7H3c0 0 0 6 0 6 0 1.2.8 2 2 2h4v-1z" />
    <path d="M7 14h4c.5 0 1-.5 1-1V7h1c0 0 0 6 0 6 0 1.2-.8 2-2 2H7v-1z" />
    <path d="M6 7c0-.7 1-.7 1 0v5c0 .7-1 .7-1 0V7z" />
    <path d="M9 7c0-.7 1-.7 1 0v5c0 .7-1 .7-1 0V7z" />
    <path d="M14 4h-3V3c0-1.2-.8-2-2-2H7c-1.2 0-2 .8-2 2v1H2c-.7 0-.7 1 0 1h12c.7 0 .7-1 0-1zm-4 0H6V3c0-.7.4-1 1-1h2c.6 0 1 .3 1 1v1z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
  </svg>
);

interface CommandSuggestionsProps {
  suggestions: Macro[];
  selectedIndex: number;
  onSelect: (macro: Macro) => void;
  onDelete: (macro: Macro) => void;
}

/**
 * CommandSuggestions - the dropdown of existing macros matching the typed command.
 * Each row can be loaded for editing (select) or deleted via an inline two-step:
 * the trash icon arms the row, then a confirm (check) deletes / cancel (x) backs out.
 */
export function CommandSuggestions({ suggestions, selectedIndex, onSelect, onDelete }: CommandSuggestionsProps) {
  const [confirmingId, setConfirmingId] = useState<Macro['id'] | null>(null);

  // Disarm when the list changes (deleted macro, edited query, dropdown reuse).
  useEffect(() => { setConfirmingId(null); }, [suggestions]);

  return (
    <div className="command-suggestions position-absolute ground-subtle rule-accent-soft">
      <div className="command-suggestions-label padding-block-tight padding-inline-comfortable font-sm ink-soft rule">
        {t('macroEditor.commandSuggestionsLabel')}
      </div>
      {suggestions.map((macro, i) => {
        const confirming = macro.id === confirmingId;
        return (
          <div
            key={macro.id}
            className={`command-suggestion-item horizontal align-center gap-comfortable padding-block-snug padding-inline-comfortable ${confirming ? 'ground-fail-faint' : 'selectable hover:ground selected:ground-defined'}`}
            aria-selected={i === selectedIndex ? 'true' : 'false'}
            data-state={confirming ? 'confirming-delete' : undefined}
            onMouseDown={e => { e.preventDefault(); onSelect(macro); }}
          >
            <span className="command-suggestion-command rigid font-md font-medium ink-accent">{macro.command}</span>
            <span className="command-suggestion-text font-sm ink-soft">{macro.text}</span>
            {confirming ? (
              <span className="command-suggestion-actions horizontal align-center gap-tight rigid">
                <button
                  type="button"
                  className="command-suggestion-action confirm horizontal align-center justify-center padding-tight corner-sm ink-fail hover:ground-fail hover:ink-inverse rigid"
                  aria-label={t('macroEditor.confirmDelete')}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onDelete(macro); setConfirmingId(null); }}
                >
                  <CheckIcon />
                </button>
                <button
                  type="button"
                  className="command-suggestion-action cancel horizontal align-center justify-center padding-tight corner-sm ink-soft hover:ground-defined hover:ink rigid"
                  aria-label={t('macroEditor.cancelDelete')}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setConfirmingId(null); }}
                >
                  <CloseIcon />
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="command-suggestion-action delete horizontal align-center justify-center padding-tight corner-sm ink-soft hover:ground-fail-faint hover:ink-fail rigid"
                aria-label={t('macroEditor.deleteMacro')}
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setConfirmingId(macro.id); }}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
