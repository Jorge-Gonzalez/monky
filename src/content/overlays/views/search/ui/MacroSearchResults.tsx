import React from 'react';
import { Macro } from '../../../../../types';
import { t } from '../../../../../lib/i18n';
import { hasPlaceholders } from '../../../../macroEngine/replacement/placeholders';

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
  resultsRef: React.RefObject<HTMLDivElement>;
}

export function MacroSearchResults({
  macros,
  selectedIndex,
  searchQuery,
  onSelect,
  onEdit,
  confirmingDeleteId,
  resultsRef,
}: MacroSearchResultsProps) {
  if (macros.length === 0) {
    return (
      <div ref={resultsRef} className="macro-search-results grid-fit-sm elastic basis-ratio scroll-auto" role="listbox">
        <div className="macro-search-empty span-all padding-lg ink-soft font-md text-center">
          {searchQuery ? t('modalSearch.noMacrosFound') : t('modalSearch.startTypingHint')}
        </div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} className="macro-search-results grid-fit-sm elastic basis-ratio scroll-auto" role="listbox">
      {macros.map((macro, index) => (
        <MacroSearchItem
          key={macro.id}
          macro={macro}
          isSelected={index === selectedIndex}
          isConfirmingDelete={macro.id === confirmingDeleteId}
          onClick={() => onSelect(macro)}
          onEdit={onEdit ? () => onEdit(macro) : undefined}
        />
      ))}
    </div>
  );
}

interface MacroSearchItemProps {
  macro: Macro;
  isSelected: boolean;
  isConfirmingDelete: boolean;
  onClick: () => void;
  onEdit?: () => void;
}

function MacroSearchItem({ macro, isSelected, isConfirmingDelete, onClick, onEdit }: MacroSearchItemProps) {
  const commandClassName = [
    'macro-search-item-command pressable padding-md rule-soft ruled-bottom font-md font-medium hidden truncate',
    isConfirmingDelete ? 'ground-fail-faint ink-fail' : 'ink-accent',
  ].join(' ');

  return (
    <div
      className="macro-search-item grid span-all position-relative selectable"
      role="option"
      aria-selected={isSelected}
      data-state={isConfirmingDelete ? 'confirming-delete' : undefined}
      onClick={onClick}
    >
      <div className={commandClassName}>{macro.command}</div>
      {isConfirmingDelete ? (
        <div className="macro-search-item-confirm padding-md hidden ground-fail-faint ink-fail rule-soft ruled-bottom font-md font-medium truncate" role="alert">
          {t('modalSearch.confirmDelete')}
        </div>
      ) : (
        <div className="macro-search-item-text padding-md hidden ink-soft rule-soft ruled-bottom font-md pressable truncate">
          {!hasPlaceholders(macro.text)
            ? macro.text
            : macro.text.split(/(\{\{[^}]+\}\})/g).map((part, i) =>
                part.startsWith('{{')
                  ? <mark key={i}><span>{'{{'}</span>{part.slice(2, -2)}<span>{'}}'}</span></mark>
                  : part
              )}
        </div>
      )}
      {onEdit && !isConfirmingDelete && (
        <button
          className="macro-search-item-edit horizontal padding-xs align-center justify-center position-absolute center-y ink-soft corner-sm pressable concealed hover:ground-defined hover:ink-accent parent-hover:revealed parent-selected:revealed"
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
