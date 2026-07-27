import type { ModalCommand } from '../modalCommands'
import { t } from '../../../../../lib/i18n'
import { SearchResultsPanel, searchOptionId } from './SearchResultsPanel'

interface MacroCommandResultsProps {
  commands: ModalCommand[]
  selectedIndex: number
  onSelect: (command: ModalCommand) => void
}

export function MacroCommandResults({ commands, selectedIndex, onSelect }: MacroCommandResultsProps) {
  if (commands.length === 0) {
    return (
      <SearchResultsPanel>
        <div data-component="search-empty" className="span-all padding-lg
          ink-soft font-md text-center" role="status">{t('modalSearch.noMatchingCommands')}</div>
      </SearchResultsPanel>
    )
  }

  return (
    <SearchResultsPanel role="listbox" label={t('modalSearch.commandResultsLabel')} activeIndex={selectedIndex}>
      {commands.map((cmd, index) => (
        <div
          key={cmd.id}
          id={searchOptionId(index)}
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
          <div data-component="search-item-command" className="padding-right-xs padding-left-md padding-top-lg padding-bottom-lg hidden width-command
            tween-ground-quick
            ink-accent rule-soft ruled-bottom font-lg font-semibold font-mono truncate">{cmd.command}</div>
          <em data-component="search-item-text" className="padding-left-xs padding-right-md padding-top-lg padding-bottom-lg
            tween-ground-quick
            ink rule-soft font-lg">{cmd.description}</em>
        </div>
      ))}
    </SearchResultsPanel>
  )
}
