import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import fuzzysort from 'fuzzysort';
import { Macro } from '../../../../types';
import { useThemeColors } from '../../../../theme/hooks/useThemeColors';
import { useMacroStore } from '../../../../store/useMacroStore';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useListNavigation } from '../hooks/useListNavigation';

export interface MacroSuggestionsProps {
  macros: Macro[];
  filterBuffer: string;
  mode: 'filter' | 'showAll';
  position: { x: number; y: number };
  placement: 'top' | 'bottom';
  isVisible: boolean;
  onSelectMacro: (macro: Macro) => void;
  onClose: () => void;
}

export function MacroSuggestions({
  macros,
  filterBuffer,
  mode,
  position,
  placement,
  isVisible,
  onSelectMacro,
  onClose,
}: MacroSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  const theme = useMacroStore(state => state.config.theme);
  useThemeColors(containerRef, theme, isVisible);

  // Filter macros based on mode and buffer
  const filteredMacros = useMemo(() => {
    if (!macros || macros.length === 0) {
      return [];
    }

    if (mode === 'showAll') {
      // If we have a buffer in showAll mode, use fuzzy search
      if (filterBuffer && filterBuffer.length > 0) {
        try {
          const results = fuzzysort.go(filterBuffer, macros, {
            keys: ['command', 'text'],
            threshold: -10000, // Allow more fuzzy matches
          });
          const fuzzyMatches = results.slice(0, 5).map(r => r.obj);
          
          // If fuzzy search found matches, return them
          if (fuzzyMatches.length > 0) {
            return fuzzyMatches;
          }
          
          // If no fuzzy matches, try simple string matching as fallback
          const lowerBuffer = filterBuffer.toLowerCase();
          const simpleMatches = macros
            .filter(macro => {
              const lowerCommand = macro.command.toLowerCase();
              const lowerText = macro.text.toLowerCase();
              return lowerCommand.includes(lowerBuffer) || lowerText.includes(lowerBuffer);
            })
            .slice(0, 5);
          
          // If simple matches found, return them
          if (simpleMatches.length > 0) {
            return simpleMatches;
          }
          
          // If no matches at all, show first 5 macros as fallback in showAll mode
          return macros.slice(0, 5);
        } catch (error) {
          console.warn('Fuzzy search failed, falling back to simple filter:', error);
          // Fallback to simple string matching
          const lowerBuffer = filterBuffer.toLowerCase();
          const fallbackMatches = macros
            .filter(macro => {
              const lowerCommand = macro.command.toLowerCase();
              const lowerText = macro.text.toLowerCase();
              return lowerCommand.includes(lowerBuffer) || lowerText.includes(lowerBuffer);
            })
            .slice(0, 5);
          
          // If even simple matching fails, show all macros in showAll mode
          return fallbackMatches.length > 0 ? fallbackMatches : macros.slice(0, 5);
        }
      } else {
        // No buffer, show first 5 macros
        return macros.slice(0, 5);
      }
    }

    // Filter mode (original behavior)
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
      // Don't auto-focus in showAll mode to prevent interfering with macro detection
      // The user can navigate manually with keyboard if needed
      if (mode !== 'showAll') {
        const targetIndex = navigation.selectedIndex ?? 0;
        buttonRefs.current[targetIndex]?.focus();
      }
    }
  }, [filteredMacros.length, navigation.selectedIndex, isVisible, mode]);

  useKeyboardNavigation({
    isActive: isVisible,
    onSelect: handleSelect,
    onClose,
    onNavigateLeft: navigation.navigateLeft,
    onNavigateRight: navigation.navigateRight,
    preventTabHandling: false, // Allow Tab navigation within the popup
  });

  const shouldShow = isVisible && filteredMacros.length > 0;
  const selectedMacro = filteredMacros[navigation.selectedIndex];

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="macro-suggestions-container"
      style={{ 
        left: position.x,
        top: position.y,
        position: 'fixed',
      }}
    >
      <div className={`macro-suggestions-arrow ${placement}`} />
      <div role="listbox" className="macro-suggestions-commands-list">
        {filteredMacros.map((macro, index) => (
          <button
            key={macro.id}
            ref={(el) => { buttonRefs.current[index] = el; }}
            className={`macro-suggestions-command-item ${index === navigation.selectedIndex ? 'selected' : ''}`}
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
        <div className="macro-suggestions-text-preview">
          {selectedMacro.text}
        </div>
      )}
      
      <div className="macro-suggestions-footer">
        <span>
          <kbd className="macro-suggestions-kbd">←</kbd>
          <kbd className="macro-suggestions-kbd">→</kbd>/
          <kbd className="macro-suggestions-kbd">Tab</kbd> Navigate
        </span>
        <span>
          <kbd className="macro-suggestions-kbd">↵</kbd> Select
        </span>
        <span>
          <kbd className="macro-suggestions-kbd">Esc</kbd> Cancel
        </span>
      </div>
    </div>
  );
}