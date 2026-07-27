import { Macro } from '../../../../../types';
import { t } from '../../../../../lib/i18n';
import { splitPlaceholders } from '../../../../macroEngine/replacement/placeholders';
import { SearchResultsPanel, searchOptionId } from './SearchResultsPanel';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15.5 5.5 2.828 2.83M3 21l.047-.332c.168-1.175.252-1.763.443-2.311.17-.487.401-.95.69-1.378.323-.482.743-.902 1.583-1.741L17.41 3.59a2 2 0 0 1 2.828 2.828L8.377 18.28c-.761.761-1.142 1.142-1.576 1.445-.385.269-.8.492-1.237.664-.492.193-1.02.3-2.076.513L3 21Z"/>
  </svg>
);

interface MacroSearchResultsProps {
  macros: Macro[];
  selectedIndex: number;
  searchQuery: string;
  onSelect: (macro: Macro) => void;
  onEdit?: (macro: Macro) => void;
  confirmingDeleteId?: Macro['id'];
}

export function MacroSearchResults({
  macros,
  selectedIndex,
  searchQuery,
  onSelect,
  onEdit,
  confirmingDeleteId,
}: MacroSearchResultsProps) {
  return (
    <SearchResultsPanel
      role={macros.length === 0 ? undefined : 'listbox'}
      label={macros.length === 0 ? undefined : t('modalSearch.macroResultsLabel')}
      activeIndex={selectedIndex}
    >
      {macros.length === 0 ? (
        <div
          data-component="search-empty"
          className="span-all padding-lg
            ink-soft font-md text-center"
          role="status"
        >
          {searchQuery ? t('modalSearch.noMacrosFound') : t('modalSearch.startTypingHint')}
        </div>
      ) : (
        macros.map((macro, index) => (
          <MacroSearchItem
            key={macro.id}
            optionId={searchOptionId(index)}
            macro={macro}
            isSelected={index === selectedIndex}
            isConfirmingDelete={macro.id === confirmingDeleteId}
            onClick={() => onSelect(macro)}
            onEdit={onEdit ? () => onEdit(macro) : undefined}
          />
        ))
      )}
    </SearchResultsPanel>
  );
}

interface MacroSearchItemProps {
  optionId: string;
  macro: Macro;
  isSelected: boolean;
  isConfirmingDelete: boolean;
  onClick: () => void;
  onEdit?: () => void;
}

function MacroSearchItem({ optionId, macro, isSelected, isConfirmingDelete, onClick, onEdit }: MacroSearchItemProps) {
  return (
    <div
      id={optionId}
      data-component="search-item"
      className={`subgrid span-all position-relative selectable corner-3xl ${
        isConfirmingDelete ? 'ground-fail-faint' : 'hover:ground-subtle selected:ground-defined'
      }`}
      role="option"
      aria-selected={isSelected}
      data-state={isConfirmingDelete ? 'confirming-delete' : undefined}
      onClick={onClick}
    >
      <div 
        data-component="search-item-command" 
        className={`padding-right-xs padding-top-sm padding-bottom-sm padding-left-md hidden width-command tween-ground-quick font-md font-bold pressable truncate ${
          isConfirmingDelete 
            ? 'ink-fail' 
            : 'ink-accent'
        }`}
      >
        {macro.command}
      </div>
      {isConfirmingDelete ? (
        <div 
          data-component="search-item-confirm" 
          className="padding-left-xs padding-top-sm padding-bottom-sm padding-right-md hidden
            ink-fail rule-soft ruled-bottom font-md font-medium truncate" 
          role="alert"
        >
          {t('modalSearch.confirmDelete')}
        </div>
      ) : (
        <div 
          data-component="search-item-text"
          className="padding-left-xs padding-top-sm padding-bottom-sm padding-right-md hidden
            tween-ground-quick
            ink font-md pressable truncate
            parent-selected:overflow-visible parent-selected:text-wrap"
        >
          <PlaceholderText text={macro.text} />
        </div>
      )}
      {onEdit && !isConfirmingDelete && (
        <button
          data-component="search-item-edit"
          className="horizontal padding-xs align-center justify-center center-y inset-right-sm
            position-absolute
            tween-opacity-ground-ink-quick
            ink-soft corner-sm pressable concealed
            hover:ground-defined hover:ink-accent
            parent-hover:revealed
            parent-selected:revealed"
          onClick={e => { e.stopPropagation(); onEdit(); }}
          aria-label={t('modalSearch.editMacro')}
          tabIndex={-1}
        >
          <EditIcon />
        </button>
      )}
    </div>
  );
}

/** Macro text with its {{placeholder}} braces faded back behind the label. */
function PlaceholderText({ text }: { text: string }) {
  return (
    <>
      {splitPlaceholders(text).map((segment, i) =>
        segment.isPlaceholder ? (
          <span key={i}>
            <span className="alpha-35">{'{{'}</span>
            {segment.text}
            <span className="alpha-35">{'}}'}</span>
          </span>
        ) : (
          segment.text
        )
      )}
    </>
  );
}
