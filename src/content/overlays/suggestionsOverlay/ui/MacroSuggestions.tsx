import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Macro } from '../../../../types';
import { t } from '../../../../lib/i18n';
import { useMacroStore } from '../../../../store/useMacroStore';
import { useThemeColors } from '../../../../theme/hooks/useThemeColors';

interface MacroSuggestionsProps {
  macros: Macro[];
  buffer: string;
  position: { x: number; y: number };
  isVisible: boolean;
  selectedIndex: number;
  onSelectMacro: (macro: Macro) => void;
}

export function MacroSuggestions({ 
  macros, 
  buffer, 
  position: coords, 
  isVisible, 
  selectedIndex,
  onSelectMacro
}: MacroSuggestionsProps) {

  const containerRef = useRef<HTMLDivElement>(null);

  const theme = useMacroStore(state => state.config.theme);

  useThemeColors(containerRef, theme, isVisible);
  

  const position = useMemo(() => {
    if (!coords) return { top: -9999, left: -9999 };
    // Position below the cursor, with a small offset
    return { top: coords.y + 8, left: coords.x };
  }, [coords?.x, coords?.y]);

  const [filteredMacros, setFilteredMacros] = useState<Macro[]>([]);

  useEffect(() => {
    if (!buffer || buffer.length < 2 || !isVisible) {
      setFilteredMacros([]);
      return;
    }

    const matches = macros
      .filter(macro => macro.command.toLowerCase().startsWith(buffer.toLowerCase()))
      .slice(0, 5);

    setFilteredMacros(matches);
  }, [macros, buffer, isVisible]);

  const shouldShow = isVisible && filteredMacros.length > 0;

  return (
    <div 
      ref={containerRef}
      className="macro-suggestions-container"
      style={{ 
        left: position.left,
        top: position.top,
        position: 'fixed',
        display: shouldShow ? 'block' : 'none',
        zIndex: 2147483647
      }}
    >
      {filteredMacros.map((macro, index) => (
        <div
          key={macro.id}
          className={`macro-suggestions-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelectMacro(macro)}
        >
          <div className="macro-suggestions-item-content">
            <div className="macro-suggestions-item-command">
              {macro.command}
            </div>
            <div className="macro-suggestions-item-text">
              {macro.text.length > 30 ? `${macro.text.substring(0, 30)}...` : macro.text}
            </div>
          </div>
          {index === selectedIndex && (
            <div className="macro-suggestions-item-indicator">
              ⭾
            </div>
          )}
        </div>
      ))}
      
      {filteredMacros.length > 0 && (
        <div className="macro-suggestions-footer">
          <kbd className="macro-suggestions-kbd">Tab</kbd> Select
        </div>
      )}
    </div>
  );
}