import React, { useEffect, useState, useRef } from 'react';
import { Macro } from '../../../../types';
import { t } from '../../../../lib/i18n';
import { useMacroStore } from '../../../../store/useMacroStore';
import { useThemeColors } from '../../../../hooks/useThemeColors';

interface MacroSuggestionsProps {
  macros: Macro[];
  buffer: string;
  position: { x: number; y: number };
  isVisible: boolean;
  selectedIndex: number;
  onSelectMacro: (macro: Macro) => void;
}

export function MacroSuggestions({ 
  macros: realMacros, 
  buffer: realBuffer, 
  position: realPosition, 
  isVisible: realIsVisible, 
  selectedIndex: realSelectedIndex,
  onSelectMacro: realOnSelectMacro 
}: MacroSuggestionsProps) {
  // --- TEMPORARY DEBUGGING VALUES ---
  // Set isDebugging to false to return to normal behavior
  const isDebugging = true; 
  const macros = isDebugging ? [
    {id: '1', command: '/hello', text: 'Hello world, this is a test macro.', html: '', is_sensitive: false, contentType: 'text/plain' as const}, 
    {id: '2', command: '/sig', text: 'Best regards, Jorge.', html: '', is_sensitive: false, contentType: 'text/plain' as const}
  ] : realMacros;
  const buffer = isDebugging ? '/h' : realBuffer;
  const position = isDebugging ? { x: 10, y: 10 } : realPosition; // 10px offset for better visibility
  const isVisible = isDebugging ? true : realIsVisible;
  const selectedIndex = isDebugging ? 0 : realSelectedIndex;
  const onSelectMacro = isDebugging ? () => console.log('Selected macro') : realOnSelectMacro;
  // --- END TEMPORARY DEBUGGING VALUES ---

  const containerRef = useRef<HTMLDivElement>(null);
  // Get theme from the store and apply it to the container
  const theme = useMacroStore(state => state.config.theme);
  useThemeColors(containerRef, theme, isVisible);

  const [filteredMacros, setFilteredMacros] = useState<Macro[]>([]);

  useEffect(() => {
    // In debug mode, always show the mock macros
    if (isDebugging) {
      setFilteredMacros(macros);
      return;
    }

    if (!buffer || buffer.length < 2 || !isVisible) {
      setFilteredMacros([]);
      return;
    }

    const matches = macros
      .filter(macro => macro.command.toLowerCase().startsWith(buffer.toLowerCase()))
      .slice(0, 5);

    setFilteredMacros(matches);
  }, [macros, buffer, isVisible, isDebugging]);

  if (!isVisible || filteredMacros.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="macro-suggestions-container"
      style={{ 
        left: position.x,
        top: position.y,
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
          <kbd className="macro-suggestions-kbd">Tab</kbd> {t('suggestions.select')}
        </div>
      )}
    </div>
  );
}