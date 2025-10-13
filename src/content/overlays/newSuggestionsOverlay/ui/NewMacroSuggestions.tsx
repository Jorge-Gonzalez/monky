import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePopupPosition } from '../utils/popupPositioning';
import { Macro } from '../../../../types';
import { useThemeColors } from '../../../../theme/hooks/useThemeColors';
import { useMacroStore } from '../../../../store/useMacroStore';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useListNavigation } from '../hooks/useListNavigation';

  
export interface NewMacroSuggestionsProps {
  macros: Macro[];
  buffer: string;
  cursorPosition: { x: number; y: number };
  isVisible: boolean;
  onSelectMacro: (macro: Macro) => void;
  onClose: () => void;
  onSelectedIndexChange: (index: number) => void;
  showAll?: boolean;
}

export function NewMacroSuggestions({
  macros,
  buffer,
  cursorPosition,
  isVisible,
  onSelectMacro,
  onClose,
  onSelectedIndexChange,
  showAll = false
}: NewMacroSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const positionResult = usePopupPosition(
    isVisible,
    cursorPosition,
    containerRef
  );

  const x = positionResult?.x ?? cursorPosition?.x ?? 100;
  const y = positionResult?.y ?? ((cursorPosition?.y ?? 100) + 20);
  const placement = positionResult?.placement ?? 'top';
  
  const theme = useMacroStore(state => state.config.theme);

  // Always enable theme when visible
  useThemeColors(containerRef, theme, isVisible);

  const [filteredMacros, setFilteredMacros] = useState<Macro[]>([]);

  useEffect(() => {
    if (!isVisible) {
      setFilteredMacros([]);
      return;
    }

    if (showAll) {
      const allMacros = macros.slice(0, 5);
      setFilteredMacros(allMacros);
      return;
    }

    if (!buffer || buffer.length === 0) {
      setFilteredMacros([]);
      return;
    }

    if (buffer.length < 1) {
      setFilteredMacros([]);
      return;
    }

    const matches = macros
      .filter(macro => 
        macro.command.toLowerCase().startsWith(buffer.toLowerCase()) ||
        macro.command.toLowerCase().includes(buffer.toLowerCase())
      )
      .slice(0, 5);

    setFilteredMacros(matches);
  }, [macros, buffer, isVisible, showAll]);

  const navigation = useListNavigation(filteredMacros.length);

  const handleSelect = useCallback(() => {
    const selectedMacro = filteredMacros[navigation.selectedIndex];
    if (selectedMacro) {
      onSelectMacro(selectedMacro);
    }
  }, [filteredMacros, navigation.selectedIndex, onSelectMacro]);

  // Report selected index changes to the manager
  useEffect(() => {
    onSelectedIndexChange(navigation.selectedIndex);
  }, [navigation.selectedIndex, onSelectedIndexChange]);

  useEffect(() => {
    if (filteredMacros.length > 0) {
      // Focus the first or selected button
      const targetIndex = navigation.selectedIndex ?? 0;
      buttonRefs.current[targetIndex]?.focus();
    }
  }, [filteredMacros, navigation.selectedIndex]);

  useKeyboardNavigation({
    isActive: isVisible,
    onSelect: handleSelect,
    onClose,
    onNavigateLeft: navigation.navigateLeft,
    onNavigateRight: navigation.navigateRight,
  });

  const shouldShow = isVisible && filteredMacros.length > 0;
  const selectedMacro = filteredMacros[navigation.selectedIndex];

  return (
    <div
      ref={containerRef}
      className="new-macro-suggestions-container"
      style={{ 
        left: x,
        top: y,
        position: 'fixed',
        display: shouldShow ? 'block' : 'none'
      }}
    >
      <div className={`new-macro-suggestions-arrow ${placement}`} />
      <div role="listbox" className="new-macro-suggestions-commands-row">
        {filteredMacros.map((macro, index) => (
          <button
            key={macro.id}
            ref={(el) => { buttonRefs.current[index] = el }}
            className={`new-macro-suggestions-command-item ${index === navigation.selectedIndex ? 'selected' : ''}`}
            onClick={() => onSelectMacro(macro)}
            type="button"
          >
            {macro.command}
          </button>
        ))}
      </div>
      {selectedMacro && (
        <div className="new-macro-suggestions-text-preview">
          {selectedMacro.text}
        </div>
      )}
      
      {shouldShow && (
        <div className="new-macro-suggestions-footer">
          <span><kbd className="new-macro-suggestions-kbd">←</kbd><kbd className="new-macro-suggestions-kbd">→</kbd>/<kbd className="new-macro-suggestions-kbd">Tab</kbd> Navigate</span>
          <span><kbd className="new-macro-suggestions-kbd">↵</kbd> Select</span>
          <span><kbd className="new-macro-suggestions-kbd">Esc</kbd> Cancel</span>
        </div>
      )}
    </div>
  );
}