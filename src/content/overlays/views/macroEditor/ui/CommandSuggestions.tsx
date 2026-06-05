import { useEffect, useState } from 'react';
import { Macro } from '../../../../../types';
import { t } from '../../../../../lib/i18n';

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="15 16 27 27" fill="currentColor">
    <path fillRule="evenodd" d="M36 26v10.997A3 3 0 0 1 32.991 40H23.01a3.004 3.004 0 0 1-3.009-3.003V26zm-2 0v10.998c0 .554-.456 1.002-1.002 1.002h-9.995a1.006 1.006 0 0 1-1.002-1.002V26h12zm-9-5a1 1 0 0 1 .991-1h4.018a1 1 0 0 1 0 2h-4.018A.993.993 0 0 1 25 21m0 6.997A.996.996 0 0 1 26 27c.552 0 1 .453 1 .997v6.006A.996.996 0 0 1 26 35c-.552 0-1-.453-1-.997zm4 0A.996.996 0 0 1 30 27c.552 0 1 .453 1 .997v6.006A.996.996 0 0 1 30 35c-.552 0-1-.453-1-.997zM23 22h-4.008c-.536 0-.992.448-.992 1 0 .556.444 1 .992 1h18.016c.536 0 .992-.448.992-1 0-.556-.444-1-.992-1H33v-1c0-1.653-1.343-3-3-3h-3.999c-1.652 0-3 1.343-3 3z" />
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
    <div className="command-suggestions">
      <div className="command-suggestions-label">
        {t('macroEditor.commandSuggestionsLabel')}
      </div>
      {suggestions.map((macro, i) => {
        const confirming = macro.id === confirmingId;
        return (
          <div
            key={macro.id}
            className={`command-suggestion-item ${i === selectedIndex ? 'selected' : ''} ${confirming ? 'confirming-delete' : ''}`}
            onMouseDown={e => { e.preventDefault(); onSelect(macro); }}
          >
            <span className="command-suggestion-command">{macro.command}</span>
            <span className="command-suggestion-text">{macro.text}</span>
            {confirming ? (
              <span className="command-suggestion-actions">
                <button
                  type="button"
                  className="command-suggestion-action confirm"
                  aria-label={t('macroEditor.confirmDelete')}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onDelete(macro); setConfirmingId(null); }}
                >
                  <CheckIcon />
                </button>
                <button
                  type="button"
                  className="command-suggestion-action cancel"
                  aria-label={t('macroEditor.cancelDelete')}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setConfirmingId(null); }}
                >
                  <CloseIcon />
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="command-suggestion-action delete"
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
