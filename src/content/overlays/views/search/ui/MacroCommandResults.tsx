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
      <div ref={resultsRef} data-component="search-results" className="grid-fit-sm elastic basis-ratio padding-right-lg padding-left-xl margin-right-xs content-align-start scroll-auto max-height-results-md" role="listbox">
        <div data-component="search-empty" className="span-all padding-lg
          ink-soft font-md text-center">{t('modalSearch.noMatchingCommands')}</div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} data-component="search-results" className="grid-fit-sm elastic basis-ratio padding-right-lg padding-left-xl margin-right-xs content-align-start scroll-auto max-height-results-md" role="listbox">
      {commands.map((cmd, index) => (
        <div
          key={cmd.id}
          data-component="search-item"
          className="subgrid span-all
            position-relative
            selectable
            corner-md
            hover:ground-subtle
            selected:ground-defined"
          role="option"
          aria-selected={index === selectedIndex}
          onClick={() => onSelect(cmd)}
        >
          <div data-component="search-item-command" className="padding-right-xs padding-left-md padding-top-lg padding-bottom-lg hidden
            tween-ground-quick
            ink-accent rule-soft ruled-bottom font-lg font-semibold font-mono truncate">{cmd.command}</div>
          <em data-component="search-item-text" className="padding-left-xs padding-right-md padding-top-lg padding-bottom-lg
            tween-ground-quick
            ink rule-soft font-lg">{cmd.description}</em>
        </div>
      ))}
    </div>
  );
}
