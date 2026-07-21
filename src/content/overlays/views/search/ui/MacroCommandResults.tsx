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
      <div ref={resultsRef} data-component="search-results" className="grid-fit-sm elastic basis-ratio padding-left-xl padding-right-lg margin-right-xs max-height-results-md scroll-auto content-align-start" role="listbox">
        <div data-component="search-empty" className="span-all padding-lg ink-soft font-md text-center">{t('modalSearch.noMatchingCommands')}</div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} data-component="search-results" className="grid-fit-sm elastic basis-ratio padding-left-xl padding-right-lg margin-right-xs max-height-results-md scroll-auto content-align-start" role="listbox">
      {commands.map((cmd, index) => (
        <div
          key={cmd.id}
          data-component="search-item"
          className="subgrid span-all position-relative selectable corner-md hover:ground-subtle selected:ground-defined"
          role="option"
          aria-selected={index === selectedIndex}
          onClick={() => onSelect(cmd)}
        >
          <div data-component="search-item-command" className="padding-top-lg padding-right-xs padding-bottom-lg padding-left-md hidden ink-accent rule-soft ruled-bottom font-lg font-semibold font-mono truncate tween-ground-quick">{cmd.command}</div>
          <em data-component="search-item-text" className="padding-top-lg padding-right-md padding-bottom-lg padding-left-xs ink rule-soft font-lg tween-ground-quick">{cmd.description}</em>
        </div>
      ))}
    </div>
  );
}
