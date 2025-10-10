import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Macro } from '../../../../types';
import { useMacroStore } from '../../../../store/useMacroStore';
import { useMacroSearch } from '../hooks/useMacroSearch';
import { useListNavigation } from '../hooks/useListNavigation';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { useScrollIntoView } from '../hooks/useScrollIntoView';
import { useAutoFocus } from '../hooks/useAutoFocus';
import { MacroSearchInput } from './MacroSearchInput';
import { MacroSearchResults } from './MacroSearchResults';
import { MacroSearchFooter } from './MacroSearchFooter';

interface MacroSearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectMacro: (macro: Macro) => void;
  position: { x: number; y: number };
  /** Optional initial search query */
  initialQuery?: string;
  /** Optional max results limit */
  maxResults?: number;
}

export function MacroSearchOverlay({
  isVisible,
  onClose,
  onSelectMacro,
  position
}: MacroSearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Optimized store access
  const { macros, theme } = useMacroStore(state => ({
    macros: state.macros,
    theme: state.config.theme,
  }));

  const filteredMacros = useMacroSearch(macros, searchQuery);
  const navigation = useListNavigation(filteredMacros.length);

  // Reset state when overlay opens
  useEffect(() => {
    if (isVisible) {
      setSearchQuery('');
      navigation.reset();
    }
  }, [isVisible]);

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
  useAutoFocus(inputRef, isVisible);
  useThemeColors(modalRef, theme, isVisible);
  useScrollIntoView(resultsRef, navigation.selectedIndex, '.macro-search-item.selected');
  useKeyboardNavigation({
    isActive: isVisible,
    itemCount: filteredMacros.length,
    selectedIndex: navigation.selectedIndex,
    onSelect: handleSelect,
    onClose,
    onNavigateUp: navigation.navigateUp,
    onNavigateDown: navigation.navigateDown,
  });

  if (!isVisible) return null;

  return (
    <div 
      className="macro-search-backdrop" 
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="macro-search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Search macros"
        onClick={e => e.stopPropagation()}
      >
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
    </div>
  );
}