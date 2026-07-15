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
      <div ref={resultsRef} className="macro-search-results grid-fit-sm elastic basis-ratio scroll-auto" role="listbox">
        <div className="macro-search-empty span-all padding-lg ink-soft font-md text-center">{t('modalSearch.noMatchingCommands')}</div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} className="macro-search-results grid-fit-sm elastic basis-ratio scroll-auto" role="listbox">
      {commands.map((cmd, index) => (
        <div
          key={cmd.id}
          className="macro-search-item modal-command-item grid span-all position-relative"
          role="option"
          aria-selected={index === selectedIndex}
          onClick={() => onSelect(cmd)}
        >
          <div className="macro-search-item-command modal-command-name padding-md hidden ink-accent rule-soft ruled-bottom font-md font-semibold font-mono truncate">{cmd.command}</div>
          <div className="macro-search-item-text modal-command-description padding-md ink-soft rule-soft font-md">{cmd.description}</div>
        </div>
      ))}
    </div>
  );
}
