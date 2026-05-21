import { ModalCommand } from '../modalCommands';
import { t } from '../../../../../lib/i18n';

interface MacroCommandResultsProps {
  commands: ModalCommand[];
  selectedIndex: number;
  onSelect: (command: ModalCommand) => void;
  resultsRef: React.RefObject<HTMLDivElement>;
}

export function MacroCommandResults({ commands, selectedIndex, onSelect, resultsRef }: MacroCommandResultsProps) {
  if (commands.length === 0) {
    return (
      <div ref={resultsRef} className="macro-search-results">
        <div className="macro-search-empty">{t('modalSearch.noMatchingCommands')}</div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} className="macro-search-results">
      {commands.map((cmd, index) => (
        <div
          key={cmd.id}
          className={`macro-search-item modal-command-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(cmd)}
        >
          <div className="macro-search-item-command modal-command-name">{cmd.command}</div>
          <div className="macro-search-item-text modal-command-description">{cmd.description}</div>
        </div>
      ))}
    </div>
  );
}
