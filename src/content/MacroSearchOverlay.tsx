import React, { useState, useEffect, useRef, useMemo } from 'react';
import fuzzysort from 'fuzzysort';
import { Macro } from '../types';
import { useMacroStore } from '../store/useMacroStore';
import { isDarkTheme } from '../lib/themeUtils';

interface MacroSearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectMacro: (macro: Macro) => void;
  position: { x: number; y: number };
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
      const isDark = isDarkTheme(theme);
      
      // Apply theme to the modal container via inline styles for maximum specificity
      if (isDark) {
        modalElement.classList.add('dark');
        modalElement.classList.remove('light');
        // Apply dark theme inline styles
        modalElement.style.backgroundColor = '#1f2937';
        modalElement.style.color = '#f3f4f6';
        
        // Apply dark theme to input
        const inputElement = modalElement.querySelector('.macro-search-input') as HTMLInputElement;
        if (inputElement) {
          inputElement.style.backgroundColor = '#374151';
          inputElement.style.borderColor = '#4b5563';
          inputElement.style.color = '#f3f4f6';
        }
        
        // Apply dark theme to items
        const items = modalElement.querySelectorAll('.macro-search-item');
        items.forEach(item => {
          (item as HTMLElement).style.borderBottomColor = '#374151';
        });
        
        // Apply dark theme to commands and text
        const commands = modalElement.querySelectorAll('.macro-search-item-command');
        commands.forEach(cmd => {
          (cmd as HTMLElement).style.color = '#60a5fa';
        });
        
        const texts = modalElement.querySelectorAll('.macro-search-item-text');
        texts.forEach(text => {
          (text as HTMLElement).style.color = '#9ca3af';
        });
        
        // Apply dark theme to kbd elements
        const kbds = modalElement.querySelectorAll('.macro-search-kbd');
        kbds.forEach(kbd => {
          (kbd as HTMLElement).style.backgroundColor = '#4b5563';
          (kbd as HTMLElement).style.borderColor = '#6b7280';
          (kbd as HTMLElement).style.color = '#f3f4f6';
        });
        
      } else {
        modalElement.classList.add('light');
        modalElement.classList.remove('dark');
        // Apply light theme inline styles
        modalElement.style.backgroundColor = 'white';
        modalElement.style.color = '#111827';
        
        // Apply light theme to input
        const inputElement = modalElement.querySelector('.macro-search-input') as HTMLInputElement;
        if (inputElement) {
          inputElement.style.backgroundColor = 'white';
          inputElement.style.borderColor = '#e5e7eb';
          inputElement.style.color = '#111827';
        }
        
        // Apply light theme to items
        const items = modalElement.querySelectorAll('.macro-search-item');
        items.forEach(item => {
          (item as HTMLElement).style.borderBottomColor = '#f3f4f6';
        });
        
        // Apply light theme to commands and text
        const commands = modalElement.querySelectorAll('.macro-search-item-command');
        commands.forEach(cmd => {
          (cmd as HTMLElement).style.color = '#3b82f6';
        });
        
        const texts = modalElement.querySelectorAll('.macro-search-item-text');
        texts.forEach(text => {
          (text as HTMLElement).style.color = '#6b7280';
        });
        
        // Apply light theme to kbd elements
        const kbds = modalElement.querySelectorAll('.macro-search-kbd');
        kbds.forEach(kbd => {
          (kbd as HTMLElement).style.backgroundColor = 'white';
          (kbd as HTMLElement).style.borderColor = '#d1d5db';
          (kbd as HTMLElement).style.color = '#111827';
        });
      }
      
      // Apply scrollbar styles
      const styleId = 'macro-search-scrollbar-styles';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      if (isDark) {
        // Dark theme scrollbar styles
        element.style.scrollbarWidth = 'thin';
        element.style.scrollbarColor = '#4b5563 #1f2937';
        
        styleElement.textContent = `
          .macro-search-results::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
          }
          .macro-search-results::-webkit-scrollbar-track {
            background: #1f2937 !important;
            border-radius: 4px !important;
          }
          .macro-search-results::-webkit-scrollbar-thumb {
            background: #4b5563 !important;
            border-radius: 4px !important;
            border: 1px solid #1f2937 !important;
          }
          .macro-search-results::-webkit-scrollbar-thumb:hover {
            background: #6b7280 !important;
          }
        `;
      } else {
        // Light theme scrollbar styles
        element.style.scrollbarWidth = 'thin';
        element.style.scrollbarColor = '#cbd5e1 #f1f5f9';
        
        styleElement.textContent = `
          .macro-search-results::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
          }
          .macro-search-results::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 4px !important;
          }
          .macro-search-results::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 4px !important;
            border: 1px solid #f1f5f9 !important;
          }
          .macro-search-results::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
        `;
      }
    }
  }, [isVisible, theme]);

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
                className={`macro-search-item ${index === selectedIndex ? 'selected' : ''}`}
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
            <kbd className="macro-search-kbd">↵</kbd> select
          </div>
          <div>
            <kbd className="macro-search-kbd">Esc</kbd> close
          </div>
        </div>
      </div>
    </div>
  );
}