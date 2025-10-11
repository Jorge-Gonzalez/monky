import React, { useState, useEffect, useRef } from 'react';
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
  
  // Fallback positioning if usePopupPosition fails
  const x = positionResult?.x ?? cursorPosition?.x ?? 100;
  const y = positionResult?.y ?? ((cursorPosition?.y ?? 100) + 20);
  const placement = positionResult?.placement ?? 'bottom';
  
  const theme = useMacroStore(state => state.config.theme);
  
  // Theme colors definition
  const getThemeColors = (isDark: boolean) => {
    if (isDark) {
      return {
        '--bg-primary': '#1f2937',
        '--bg-secondary': '#374151',
        '--bg-tertiary': 'rgba(59, 130, 246, 0.2)',
        '--text-primary': '#f3f4f6',
        '--text-secondary': '#9ca3af',
        '--text-accent': '#60a5fa',
        '--border-primary': '#374151',
        '--border-secondary': '#374151',
        '--kbd-bg': '#4b5563',
        '--kbd-border': '#6b7280',
        '--shadow-color': 'rgba(0, 0, 0, 0.4)',
      };
    } else {
      return {
        '--bg-primary': '#ededed',
        '--bg-secondary': '#e8e9e9', 
        '--bg-tertiary': '#dee5ed',
        '--text-primary': '#101624',
        '--text-secondary': '#636a76',
        '--text-accent': '#3679e4',
        '--border-primary': '#d6d8dc',
        '--border-secondary': '#e1e2e4',
        '--kbd-bg': '#e1e2e4',
        '--kbd-border': '#c3c7cb',
        '--shadow-color': 'rgba(0, 0, 0, 0.25)',
      };
    }
  };
  
  // Apply theme when component becomes visible or theme changes
  useEffect(() => {
    if (!isVisible) return;
    
    // Use a small delay to ensure DOM is ready
    const applyTheme = () => {
      if (!containerRef.current) {
        // Retry after a short delay
        setTimeout(applyTheme, 10);
        return;
      }
      
      const element = containerRef.current;
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const colors = getThemeColors(isDark);
      
      // Apply each CSS custom property
      for (const property in colors) {
        if (colors.hasOwnProperty(property)) {
          const value = colors[property];
          element.style.setProperty(property, value);
        }
      }
      
      // Add theme classes
      element.classList.toggle('dark', isDark);
      element.classList.toggle('light', !isDark);
    };
    
    // Start the theme application process
    applyTheme();
  }, [isVisible, theme]);
  
  // Additional effect to apply theme after DOM is definitely ready
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const element = containerRef.current;
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const colors = getThemeColors(isDark);
      
      // Apply colors
      for (const property in colors) {
        if (colors.hasOwnProperty(property)) {
          const value = colors[property];
          element.style.setProperty(property, value);
        }
      }
      
      element.classList.toggle('dark', isDark);
      element.classList.toggle('light', !isDark);
    }
  });

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
        position: 'fixed',
        zIndex: 2147483647
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