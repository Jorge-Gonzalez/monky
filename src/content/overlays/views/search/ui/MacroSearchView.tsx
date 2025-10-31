import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Macro } from '../../../../../types';
import { useMacroStore } from '../../../../../store/useMacroStore';
import { useMacroSearch } from '../hooks/useMacroSearch';
import { useListNavigation } from '../hooks/useListNavigation';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useScrollIntoView } from '../hooks/useScrollIntoView';
import { useAutoFocus } from '../../../hooks/useAutoFocus';
import { MacroSearchInput } from './MacroSearchInput';
import { MacroSearchResults } from './MacroSearchResults';
import { MacroSearchFooter } from './MacroSearchFooter';
import { BaseModalViewProps } from '../../../modal/types';

interface MacroSearchViewProps extends BaseModalViewProps {
  onSelectMacro: (macro: Macro) => void;
}

/**
 * MacroSearchView - Search and select macros
 *
 * This is the refactored version of MacroSearchOverlay, without the backdrop/modal wrapper.
 * The modal shell is now handled by ModalShell component.
 */
export function MacroSearchView({
  onClose,
  onViewChange,
  onSelectMacro,
}: MacroSearchViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get macros from store
  const macros = useMacroStore(state => state.macros);

  const filteredMacros = useMacroSearch(macros, searchQuery);
  const navigation = useListNavigation(filteredMacros.length);

  // Reset state when view is mounted
  useEffect(() => {
    setSearchQuery('');
    navigation.reset();
  }, []);

  const handleSelect = useCallback(() => {
    const selectedMacro = filteredMacros[navigation.selectedIndex];
    if (selectedMacro) {
      onSelectMacro(selectedMacro);
      onClose();
    }
  }, [filteredMacros, navigation.selectedIndex, onSelectMacro, onClose]);

  const handleMacroSelect = useCallback((macro: Macro) => {
    onSelectMacro(macro);
    onClose();
  }, [onSelectMacro, onClose]);

  // Apply side-effect hooks
  useAutoFocus(inputRef, true);
  useScrollIntoView(resultsRef, navigation.selectedIndex, '.macro-search-item.selected');
  useKeyboardNavigation({
    isActive: true,
    itemCount: filteredMacros.length,
    selectedIndex: navigation.selectedIndex,
    onSelect: handleSelect,
    onClose,
    onNavigateUp: navigation.navigateUp,
    onNavigateDown: navigation.navigateDown,
  });

  return (
    <div className="macro-search-view">
      <MacroSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        inputRef={inputRef}
      />

      <MacroSearchResults
        macros={filteredMacros}
        selectedIndex={navigation.selectedIndex}
        searchQuery={searchQuery}
        onSelect={handleMacroSelect}
        resultsRef={resultsRef}
      />

      <MacroSearchFooter />
    </div>
  );
}
