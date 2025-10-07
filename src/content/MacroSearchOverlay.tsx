import React, { useState, useEffect, useRef, useMemo } from 'react';
import fuzzysort from 'fuzzysort';
import { Macro } from '../types';
import { useMacroStore } from '../store/useMacroStore';
import { isDarkTheme } from '../lib/themeUtils';
import { lightThemeColors, darkThemeColors } from './theme';

interface MacroSearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectMacro: (macro: Macro) => void;
  position: { x: number; y: number };
}

function applyColors(element: HTMLElement, colors: Record<string, string>) {
  for (const [key, value] of Object.entries(colors)) {
    element.style.setProperty(key, value);
  }
}

export function MacroSearchOverlay({ isVisible, onClose, onSelectMacro, position }: MacroSearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const macros = useMacroStore(state => state.macros);
  const theme = useMacroStore(state => state.config.theme);

  // Filter macros using fuzzy search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return macros.map(macro => ({
        obj: macro,
        score: 0,
        target: macro.command,
      })).slice(0, 8);
    }
    
    const results = fuzzysort.go(searchQuery, macros, {
      keys: ['command', 'text']
    });
    
    return results.slice(0, 8);
  }, [searchQuery, macros]);

  const filteredMacros = searchResults.map(result => result.obj);

  // Reset when overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      setSearchQuery('');
      setSelectedIndex(0);
      // Focus input after a small delay to ensure overlay is rendered
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isVisible]);

  // Update selected index when filtered results change
  useEffect(() => {
    if (selectedIndex >= filteredMacros.length && filteredMacros.length > 0) {
      setSelectedIndex(0);
    }
  }, [filteredMacros.length, selectedIndex]);

  // Apply theme-aware styles directly via JavaScript
  useEffect(() => {
    if (modalRef.current && resultsRef.current && isVisible) {
      const element = resultsRef.current;
      const modalElement = modalRef.current;
      const colors = isDarkTheme(theme) ? darkThemeColors : lightThemeColors;
      const isDark = isDarkTheme(theme);

      // Apply CSS variables to the modal root
      applyColors(modalElement, colors);
      modalElement.classList.toggle('dark', isDark);
      modalElement.classList.toggle('light', !isDark);
    }
  }, [isVisible, theme]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedItem = resultsRef.current.querySelector('.macro-search-item.selected');
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredMacros.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredMacros.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredMacros[selectedIndex]) {
            onSelectMacro(filteredMacros[selectedIndex]);
            onClose();
          }
          break;
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isVisible, filteredMacros, selectedIndex, onClose, onSelectMacro]);

  if (!isVisible) return null;

  return (
    <div 
      className="macro-search-backdrop"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="macro-search-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="macro-search-input-container">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search macros..."
            className="macro-search-input"
          />
        </div>

        {/* Results */}
        <div ref={resultsRef} className="macro-search-results">
          {filteredMacros.length === 0 ? (
            <div className="macro-search-empty">
              {searchQuery ? 'No macros found' : 'Start typing to search macros...'}
            </div>
          ) : (
            filteredMacros.map((macro, index) => (
              <div
                key={macro.id}
                className={`macro-search-item ${index === selectedIndex ? 'selected' : ''}`} // The 'selected' class is styled in the main injected CSS
                onClick={() => {
                  onSelectMacro(macro);
                  onClose();
                }}
              >
                <div className="macro-search-item-command">
                  {macro.command}
                </div>
                {macro.text && (
                  <div className="macro-search-item-text">
                    {macro.text}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="macro-search-footer">
          <div>
            <kbd className="macro-search-kbd">↑↓</kbd> navigate
            <kbd className="macro-search-kbd">&#8239;↵&#8239;</kbd> select
          </div>
          <div>
            <kbd className="macro-search-kbd">Esc</kbd> close
          </div>
        </div>
      </div>
    </div>
  );
}