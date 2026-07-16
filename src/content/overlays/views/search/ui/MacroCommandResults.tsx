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
      <div ref={resultsRef} className="macro-search-results grid-fit-sm elastic basis-ratio max-height-results-md scroll-auto content-align-start scrollbar-subtle" role="listbox">
        <div className="macro-search-empty span-all padding-lg ink-soft font-md text-center">{t('modalSearch.noMatchingCommands')}</div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} className="macro-search-results grid-fit-sm elastic basis-ratio max-height-results-md scroll-auto content-align-start scrollbar-subtle" role="listbox">
      {commands.map((cmd, index) => (
        <div
          key={cmd.id}
          className="macro-search-item modal-command-item subgrid span-all position-relative selectable"
          role="option"
          aria-selected={index === selectedIndex}
          onClick={() => onSelect(cmd)}
        >
          <div className="macro-search-item-command modal-command-name padding-top-md padding-right-xs padding-bottom-md padding-left-md hidden ink-accent rule-soft ruled-bottom font-md font-semibold font-mono truncate parent-hover:ground-subtle parent-selected:ground-defined tween-ground-quick">{cmd.command}</div>
          <em className="macro-search-item-text modal-command-description padding-top-md padding-right-md padding-bottom-md padding-left-xs ink-soft rule-soft font-md parent-hover:ground-subtle parent-selected:ground-defined tween-ground-quick">{cmd.description}</em>
        </div>
      ))}
    </div>
  );
}
