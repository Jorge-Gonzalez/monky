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
  
  // // Theme colors definition
  // const getThemeColors = (isDark: boolean) => {
  //   if (isDark) {
  //     return {
  //       '--bg-primary': '#1f2937',
  //       '--bg-secondary': '#374151',
  //       '--bg-tertiary': 'rgba(59, 130, 246, 0.2)',
  //       '--text-primary': '#f3f4f6',
  //       '--text-secondary': '#9ca3af',
  //       '--text-accent': '#60a5fa',
  //       '--border-primary': '#374151',
  //       '--border-secondary': '#374151',
  //       '--kbd-bg': '#4b5563',
  //       '--kbd-border': '#6b7280',
  //       '--shadow-color': 'rgba(0, 0, 0, 0.4)',
  //     };
  //   } else {
  //     return {
  //       '--bg-primary': '#ededed',
  //       '--bg-secondary': '#e8e9e9', 
  //       '--bg-tertiary': '#dee5ed',
  //       '--text-primary': '#101624',
  //       '--text-secondary': '#636a76',
  //       '--text-accent': '#3679e4',
  //       '--border-primary': '#d6d8dc',
  //       '--border-secondary': '#e1e2e4',
  //       '--kbd-bg': '#e1e2e4',
  //       '--kbd-border': '#c3c7cb',
  //       '--shadow-color': 'rgba(0, 0, 0, 0.25)',
  //     };
  //   }
  // };
  
  // // Apply theme when component becomes visible or theme changes
  // useEffect(() => {
  //   if (!isVisible) return;
    
  //   // Use a small delay to ensure DOM is ready
  //   const applyTheme = () => {
  //     if (!containerRef.current) {
  //       // Retry after a short delay
  //       setTimeout(applyTheme, 10);
  //       return;
  //     }
      
  //     const element = containerRef.current;
  //     const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  //     const colors = getThemeColors(isDark);
      
  //     // Apply each CSS custom property
  //     for (const property in colors) {
  //       if (colors.hasOwnProperty(property)) {
  //         const value = colors[property];
  //         element.style.setProperty(property, value);
  //       }
  //     }
      
  //     // Add theme classes
  //     element.classList.toggle('dark', isDark);
  //     element.classList.toggle('light', !isDark);
  //   };
    
  //   // Start the theme application process
  //   applyTheme();
  // }, [isVisible, theme]);
  
  // // Additional effect to apply theme after DOM is definitely ready
  // useEffect(() => {
  //   if (isVisible && containerRef.current) {
  //     const element = containerRef.current;
  //     const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  //     const colors = getThemeColors(isDark);
      
  //     // Apply colors
  //     for (const property in colors) {
  //       if (colors.hasOwnProperty(property)) {
  //         const value = colors[property];
  //         element.style.setProperty(property, value);
  //       }
  //     }
      
  //     element.classList.toggle('dark', isDark);
  //     element.classList.toggle('light', !isDark);
  //   }
  // });

  // Memoize the position to prevent re-renders if the coordinate object is new but values are the same.
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

  if (!isVisible || filteredMacros.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="macro-suggestions-container"
      style={{ 
        left: position.left,
        top: position.top,
        position: 'fixed',
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