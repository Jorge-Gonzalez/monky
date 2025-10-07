import React, { useState, useRef } from 'react';
import { Macro } from '../../../types';
import { useMacroStore } from '../../../store/useMacroStore';
import { useMacroSearch } from '../hooks/useMacroSearch';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useListNavigation } from '../hooks/useListNavigation';
import { useThemeColors } from '../hooks/useThemeColors';
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
  
  const macros = useMacroStore(state => state.macros);
  const theme = useMacroStore(state => state.config.theme);
  
  const filteredMacros = useMacroSearch(macros, searchQuery);
  const navigation = useListNavigation(filteredMacros.length);

  // Reset state when overlay opens
  React.useEffect(() => {
    if (isVisible) {
      setSearchQuery('');
      navigation.reset();
    }
  }, [isVisible, navigation.reset]);

  const handleSelect = () => {
    const selectedMacro = filteredMacros[navigation.selectedIndex];
    if (selectedMacro) {
      onSelectMacro(selectedMacro);
      onClose();
    }
  };

  // Apply all the hooks
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
    <div className="macro-search-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="macro-search-modal"
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
          onSelect={macro => {
            onSelectMacro(macro);
            onClose();
          }}
          resultsRef={resultsRef}
        />
        
        <MacroSearchFooter />
      </div>
    </div>
  );
}