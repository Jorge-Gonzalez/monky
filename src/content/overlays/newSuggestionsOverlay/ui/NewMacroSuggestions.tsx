import React, { useState, useEffect, useRef, use } from 'react';
import { usePopupPosition, calculateOptimalPosition } from '../utils/popupPositioning';
import { Macro } from '../../../../types';
import { useThemeColors } from '../../../../theme/hooks/useThemeColors';
import { useMacroStore } from '../../../../store/useMacroStore';

export interface NewMacroSuggestionsProps {
  macros: Macro[];
  buffer: string;
  cursorPosition: { x: number; y: number };
  isVisible: boolean;
  selectedIndex: number;
  onSelectMacro: (macro: Macro) => void;
  onClose: () => void;
  showAll?: boolean; // Flag to show all macros regardless of buffer
}

export function NewMacroSuggestions({
  macros,
  buffer,
  cursorPosition,
  isVisible,
  selectedIndex,
  onSelectMacro,
  onClose,
  showAll = false
}: NewMacroSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const positionResult = usePopupPosition(
    isVisible,
    cursorPosition,
    containerRef
  );

  
  // // Fallback positioning if usePopupPosition fails
  // const x = positionResult?.x ?? cursorPosition?.x ?? 100;
  // const y = positionResult?.y ?? ((cursorPosition?.y ?? 100) + 20);
  // const placement = positionResult?.placement ?? 'bottom';
  
  const theme = useMacroStore(state => state.config.theme);

  useThemeColors(containerRef, theme, isVisible);

  const [filteredMacros, setFilteredMacros] = useState<Macro[]>([]);

  useEffect(() => {
    if (!isVisible) {
      setFilteredMacros([]);
      return;
    }

    // If showAll flag is true, show all macros regardless of buffer
    if (showAll) {
      const allMacros = macros.slice(0, 5);
      setFilteredMacros(allMacros);
      return;
    }

    // If buffer is empty and not in showAll mode, don't show anything
    if (!buffer || buffer.length === 0) {
      setFilteredMacros([]);
      return;
    }

    // For non-empty buffer, filter as usual but allow 1+ chars instead of 2+
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

  // Handle Escape key to close the popup
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible || filteredMacros.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="new-macro-suggestions-container"
      style={{ 
        left: x,
        top: y,
      }}
    >
        <div className={`new-macro-suggestions-arrow ${placement}`} />
        {filteredMacros.map((macro, index) => (
          <div
            key={macro.id}
            className={`new-macro-suggestions-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => onSelectMacro(macro)}
          >
            <div className="new-macro-suggestions-item-content">
              <div className="new-macro-suggestions-item-command">
                {macro.command}
              </div>
              <div className="new-macro-suggestions-item-text">
                {macro.text.length > 30 ? `${macro.text.substring(0, 30)}...` : macro.text}
              </div>
            </div>
            {index === selectedIndex && (
              <div className="new-macro-suggestions-item-indicator">
                ⭾
              </div>
            )}
          </div>
        ))}
        
        {filteredMacros.length > 0 && (
          <div className="new-macro-suggestions-footer">
            <kbd className="new-macro-suggestions-kbd">↑↓</kbd> Navigate
            <kbd className="new-macro-suggestions-kbd">Enter</kbd> Select
            <kbd className="new-macro-suggestions-kbd">Esc</kbd> Cancel
          </div>
        )}
      </div>
  );
}