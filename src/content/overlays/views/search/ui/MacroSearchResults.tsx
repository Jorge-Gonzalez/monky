import React from 'react';
import { Macro } from '../../../../../types';
import { t } from '../../../../../lib/i18n';

interface MacroSearchResultsProps {
  macros: Macro[];
  selectedIndex: number;
  searchQuery: string;
  onSelect: (macro: Macro) => void;
  resultsRef: React.RefObject<HTMLDivElement | null>;
}

export function MacroSearchResults({
  macros,
  selectedIndex,
  searchQuery,
  onSelect,
  resultsRef,
}: MacroSearchResultsProps) {
  if (macros.length === 0) {
    return (
      <div ref={resultsRef} className="macro-search-results">
        <div className="macro-search-empty">
          {searchQuery ? t('modalSearch.noMacrosFound') : t('modalSearch.startTypingHint')}
        </div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} className="macro-search-results">
      {macros.map((macro, index) => (
        <MacroSearchItem key={macro.id} macro={macro} isSelected={index === selectedIndex} onClick={() => onSelect(macro)} />
      ))}
    </div>
  );
}

interface MacroSearchItemProps {
  macro: Macro;
  isSelected: boolean;
  onClick: () => void;
}

function MacroSearchItem({ macro, isSelected, onClick }: MacroSearchItemProps) {
  return (
    <div className={`macro-search-item ${isSelected ? 'selected' : ''}`} onClick={onClick}>
      <div className="macro-search-item-command">{macro.command}</div>
      <div className="macro-search-item-text">{macro.text}</div>
    </div>
  );
}