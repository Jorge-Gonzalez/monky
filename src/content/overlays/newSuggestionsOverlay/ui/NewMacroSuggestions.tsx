import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePopupPosition } from '../utils/popupPositioning';
import { Macro } from '../../../../types';
import { useThemeColors } from '../../../../theme/hooks/useThemeColors';
import { useMacroStore } from '../../../../store/useMacroStore';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useListNavigation } from '../hooks/useListNavigation';

export interface NewMacroSuggestionsProps {
  macros: Macro[];
  filterBuffer: string;
  mode: 'filter' | 'showAll';
  cursorPosition: { x: number; y: number };
  isVisible: boolean;
  onSelectMacro: (macro: Macro) => void;
  onClose: () => void;
}

export function NewMacroSuggestions({
  macros,
  filterBuffer,
  mode,
  cursorPosition,
  isVisible,
  onSelectMacro,
  onClose,
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
  useThemeColors(containerRef, theme, isVisible);

  // Filter macros based on mode and buffer
  const filteredMacros = useMemo(() => {
    if (!isVisible) {
      return [];
    }

    if (mode === 'showAll') {
      return macros.slice(0, 5);
    }

    if (!filterBuffer || filterBuffer.length === 0) {
      return [];
    }

    const lowerBuffer = filterBuffer.toLowerCase();
    return macros
      .filter(macro => {
        const lowerCommand = macro.command.toLowerCase();
        return lowerCommand.startsWith(lowerBuffer) || lowerCommand.includes(lowerBuffer);
      })
      .slice(0, 5);
  }, [macros, filterBuffer, mode, isVisible]);

  const navigation = useListNavigation(filteredMacros.length);

  const handleSelect = useCallback(() => {
    const selectedMacro = filteredMacros[navigation.selectedIndex];
    if (selectedMacro) {
      onSelectMacro(selectedMacro);
    }
  }, [filteredMacros, navigation.selectedIndex, onSelectMacro]);

  // Focus management for keyboard navigation
  useEffect(() => {
    if (filteredMacros.length > 0 && isVisible) {
      const targetIndex = navigation.selectedIndex ?? 0;
      buttonRefs.current[targetIndex]?.focus();
    }
  }, [filteredMacros.length, navigation.selectedIndex, isVisible]);

  useKeyboardNavigation({
    isActive: isVisible,
    onSelect: handleSelect,
    onClose,
    onNavigateLeft: navigation.navigateLeft,
    onNavigateRight: navigation.navigateRight,
  });

  const shouldShow = isVisible && filteredMacros.length > 0;
  const selectedMacro = filteredMacros[navigation.selectedIndex];

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="new-macro-suggestions-container"
      style={{ 
        left: x,
        top: y,
        position: 'fixed',
      }}
    >
      <div className={`new-macro-suggestions-arrow ${placement}`} />
      <div role="listbox" className="new-macro-suggestions-commands-row">
        {filteredMacros.map((macro, index) => (
          <button
            key={macro.id}
            ref={(el) => { buttonRefs.current[index] = el; }}
            className={`new-macro-suggestions-command-item ${index === navigation.selectedIndex ? 'selected' : ''}`}
            onClick={() => onSelectMacro(macro)}
            type="button"
            role="option"
            aria-selected={index === navigation.selectedIndex}
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
      
      <div className="new-macro-suggestions-footer">
        <span>
          <kbd className="new-macro-suggestions-kbd">←</kbd>
          <kbd className="new-macro-suggestions-kbd">→</kbd>/
          <kbd className="new-macro-suggestions-kbd">Tab</kbd> Navigate
        </span>
        <span>
          <kbd className="new-macro-suggestions-kbd">↵</kbd> Select
        </span>
        <span>
          <kbd className="new-macro-suggestions-kbd">Esc</kbd> Cancel
        </span>
      </div>
    </div>
  );
}