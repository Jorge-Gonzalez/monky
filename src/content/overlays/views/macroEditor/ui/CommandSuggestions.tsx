import { Macro } from '../../../../../types';
import { t } from '../../../../../lib/i18n';

interface CommandSuggestionsProps {
  suggestions: Macro[];
  selectedIndex: number;
  onSelect: (macro: Macro) => void;
}

/**
 * CommandSuggestions - the dropdown of existing macros matching the typed command.
 */
export function CommandSuggestions({ suggestions, selectedIndex, onSelect }: CommandSuggestionsProps) {
  return (
    <div className="command-suggestions">
      <div className="command-suggestions-label">
        {t('macroEditor.commandSuggestionsLabel')}
      </div>
      {suggestions.map((macro, i) => (
        <div
          key={macro.id}
          className={`command-suggestion-item ${i === selectedIndex ? 'selected' : ''}`}
          onMouseDown={e => { e.preventDefault(); onSelect(macro); }}
        >
          <span className="command-suggestion-command">{macro.command}</span>
          <span className="command-suggestion-text">{macro.text}</span>
        </div>
      ))}
    </div>
  );
}
