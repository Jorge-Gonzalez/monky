import React from 'react';
import ReactDOM from 'react-dom/client';
import { MacroSearchOverlay } from './MacroSearchOverlay';
import { MacroSuggestions } from './MacroSuggestions';
import { Macro, EditableEl } from '../types';
import { getActiveEditable, getSelection, replaceText } from './editableUtils';

class KeyboardOverlayManager {
  private searchOverlayRoot: ReactDOM.Root | null = null;
  private suggestionsRoot: ReactDOM.Root | null = null;
  private searchOverlayContainer: HTMLDivElement | null = null;
  private suggestionsContainer: HTMLDivElement | null = null;
  private isSearchVisible = false;
  private areSuggestionsVisible = false;
  private currentPosition = { x: 0, y: 0 };
  private selectedSuggestionIndex = 0;
  private currentMacros: Macro[] = [];
  private previouslyFocusedElement: HTMLElement | null = null;
  private savedCursorPosition: { start: number; end: number } | null = null;

  constructor() {
    this.createContainers();
  }

  private createContainers() {
    // Create search overlay container
    this.searchOverlayContainer = document.createElement('div');
    this.searchOverlayContainer.id = 'macro-search-overlay';
    document.body.appendChild(this.searchOverlayContainer);
    this.searchOverlayRoot = ReactDOM.createRoot(this.searchOverlayContainer);

    // Create suggestions container  
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.id = 'macro-suggestions';
    document.body.appendChild(this.suggestionsContainer);
    this.suggestionsRoot = ReactDOM.createRoot(this.suggestionsContainer);

    // Add CSS for the containers
    this.addOverlayStyles();
  }

  private addOverlayStyles() {
    if (document.getElementById('macro-overlay-styles')) return;

    const style = document.createElement('style');
    style.id = 'macro-overlay-styles';
    style.textContent = `
      #macro-search-overlay, #macro-suggestions {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
      }
      
      #macro-search-overlay *, #macro-suggestions * {
        box-sizing: border-box;
      }

      /* Container styles */
      #macro-search-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
      }
      
      #macro-search-overlay > * {
        pointer-events: auto !important;
      }
      
      #macro-suggestions {
        position: fixed !important;
        z-index: 2147483646 !important;
      }

      /* Overlay component styles */
      .macro-search-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .macro-search-modal {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid #e5e7eb;
        min-width: 400px;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
      }

      .macro-search-input-container {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .macro-search-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.15s;
      }

      .macro-search-input:focus {
        border-color: #3b82f6;
        ring: 2px solid rgba(59, 130, 246, 0.2);
      }

      .macro-search-results {
        max-height: 300px;
        overflow-y: auto;
      }

      .macro-search-empty {
        padding: 16px;
        color: #6b7280;
        text-align: center;
        font-size: 14px;
      }

      .macro-search-item {
        padding: 12px;
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        transition: background-color 0.15s;
      }

      .macro-search-item:hover {
        background-color: #f9fafb;
      }

      .macro-search-item.selected {
        background-color: #eff6ff;
      }

      .macro-search-item-command {
        font-weight: 500;
        color: #111827;
        font-size: 14px;
      }

      .macro-search-item-text {
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .macro-search-footer {
        padding: 8px;
        border-top: 1px solid #e5e7eb;
        font-size: 12px;
        color: #6b7280;
        display: flex;
        justify-content: space-between;
      }

      .macro-search-kbd {
        padding: 2px 4px;
        background-color: #f3f4f6;
        border-radius: 3px;
        font-family: monospace;
        margin-left: 4px;
      }

      .macro-search-kbd:first-child {
        margin-left: 0;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .macro-search-modal {
          background-color: #1f2937;
          border-color: #374151;
        }

        .macro-search-input-container {
          border-bottom-color: #374151;
        }

        .macro-search-input {
          background-color: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .macro-search-input:focus {
          border-color: #3b82f6;
        }

        .macro-search-item {
          border-bottom-color: #374151;
        }

        .macro-search-item:hover {
          background-color: #374151;
        }

        .macro-search-item.selected {
          background-color: rgba(59, 130, 246, 0.2);
        }

        .macro-search-item-command {
          color: #f9fafb;
        }

        .macro-search-item-text {
          color: #9ca3af;
        }

        .macro-search-footer {
          border-top-color: #374151;
          color: #9ca3af;
        }

        .macro-search-kbd {
          background-color: #374151;
        }

        .macro-search-empty {
          color: #9ca3af;
        }
      }
    `;
    document.head.appendChild(style);
  }

  updateMacros(macros: Macro[]) {
    this.currentMacros = macros;
  }

  updatePosition(x: number, y: number) {
    this.currentPosition = { x, y };
  }

  showSearchOverlay(x?: number, y?: number) {
    // Position is now handled by flexbox centering in the component
    // Keep this for compatibility but it's not used for centering
    if (x !== undefined && y !== undefined) {
      this.currentPosition = { x, y };
    }

    // Store the currently focused element before showing overlay
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Store the current cursor position if the element is editable
    if (this.previouslyFocusedElement) {
      const editableElement = getActiveEditable(this.previouslyFocusedElement);
      if (editableElement) {
        this.savedCursorPosition = getSelection(editableElement);
      }
    }

    this.isSearchVisible = true;
    this.hideSuggestions(); // Hide suggestions when search is shown
    
    this.searchOverlayRoot?.render(
      React.createElement(MacroSearchOverlay, {
        isVisible: true,
        position: this.currentPosition,
        onClose: () => this.hideSearchOverlay(),
        onSelectMacro: (macro: Macro) => this.handleMacroSelection(macro)
      })
    );
  }

  hideSearchOverlay() {
    this.isSearchVisible = false;
    this.searchOverlayRoot?.render(React.createElement('div'));
    
    // Restore focus to previously focused element
    this.restoreFocus();
  }

  showSuggestions(buffer: string, x?: number, y?: number) {
    if (x !== undefined && y !== undefined) {
      this.currentPosition = { x, y };
    }

    // Store the currently focused element before showing suggestions
    // Only store if we don't already have one (to preserve search overlay focus)
    if (!this.previouslyFocusedElement) {
      this.previouslyFocusedElement = document.activeElement as HTMLElement;
    }

    this.areSuggestionsVisible = true;
    
    this.suggestionsRoot?.render(
      React.createElement(MacroSuggestions, {
        macros: this.currentMacros,
        buffer: buffer,
        position: this.currentPosition,
        isVisible: true,
        selectedIndex: this.selectedSuggestionIndex,
        onSelectMacro: (macro: Macro) => this.handleMacroSelection(macro)
      })
    );
  }

  hideSuggestions() {
    this.areSuggestionsVisible = false;
    this.selectedSuggestionIndex = 0;
    this.suggestionsRoot?.render(React.createElement('div'));
    
    // Only restore focus if search overlay is not visible
    if (!this.isSearchVisible) {
      this.restoreFocus();
    }
  }

  navigateSuggestions(direction: 'up' | 'down'): boolean {
    if (!this.areSuggestionsVisible) return false;

    const matchingMacros = this.currentMacros
      .filter(macro => macro.command.toLowerCase().startsWith(this.getCurrentBuffer().toLowerCase()))
      .slice(0, 5);

    if (matchingMacros.length === 0) return false;

    if (direction === 'down') {
      this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % matchingMacros.length;
    } else {
      this.selectedSuggestionIndex = this.selectedSuggestionIndex === 0 
        ? matchingMacros.length - 1 
        : this.selectedSuggestionIndex - 1;
    }

    // Re-render suggestions with new selected index
    this.suggestionsRoot?.render(
      React.createElement(MacroSuggestions, {
        macros: this.currentMacros,
        buffer: this.getCurrentBuffer(),
        position: this.currentPosition,
        isVisible: true,
        selectedIndex: this.selectedSuggestionIndex,
        onSelectMacro: (macro: Macro) => this.handleMacroSelection(macro)
      })
    );

    return true;
  }

  selectCurrentSuggestion(): boolean {
    if (!this.areSuggestionsVisible) return false;

    const matchingMacros = this.currentMacros
      .filter(macro => macro.command.toLowerCase().startsWith(this.getCurrentBuffer().toLowerCase()))
      .slice(0, 5);

    const selectedMacro = matchingMacros[this.selectedSuggestionIndex];
    if (selectedMacro) {
      this.handleMacroSelection(selectedMacro);
      return true;
    }

    return false;
  }

  getCurrentBuffer(): string {
    // This will be set by the macro detector
    return (window as any).__macroBuffer || '';
  }

  handleMacroSelection(macro: Macro) {
    // Store the macro to be inserted before hiding overlays
    const macroToInsert = macro;
    const targetElement = this.previouslyFocusedElement;

    // Hide overlays
    this.hideSearchOverlay();
    this.hideSuggestions();

    // Insert the macro content into the previously focused element
    this.insertMacroContent(macroToInsert, targetElement);

    // Dispatch custom event to notify macro detector
    const event = new CustomEvent('macro-selected', { 
      detail: { macro, position: this.currentPosition } 
    });
    document.dispatchEvent(event);
  }

  private restoreFocus() {
    if (this.previouslyFocusedElement && document.body.contains(this.previouslyFocusedElement)) {
      // Use setTimeout to ensure the overlay is fully hidden before focusing
      setTimeout(() => {
        this.previouslyFocusedElement?.focus();
        this.previouslyFocusedElement = null;
        this.savedCursorPosition = null;
      }, 10);
    } else {
      this.previouslyFocusedElement = null;
      this.savedCursorPosition = null;
    }
  }

  private insertMacroContent(macro: Macro, targetElement: HTMLElement | null) {
    if (!targetElement || !macro.text) {
      return;
    }

    // Validate that the target element is editable using the existing utility
    const editableElement = getActiveEditable(targetElement);
    if (!editableElement) {
      return;
    }

    // If we have a saved cursor position, use it; otherwise get current position
    let cursorPosition = this.savedCursorPosition;
    if (!cursorPosition) {
      cursorPosition = getSelection(editableElement);
    }
    
    if (!cursorPosition) {
      return;
    }

    // Use the existing replaceText function with zero-length replacement
    // This treats it as an insertion at the cursor position
    replaceText(editableElement, macro, cursorPosition.start, cursorPosition.start);
    
    // Clear the saved position
    this.savedCursorPosition = null;
  }

  isAnyOverlayVisible(): boolean {
    return this.isSearchVisible || this.areSuggestionsVisible;
  }

  destroy() {
    this.hideSearchOverlay();
    this.hideSuggestions();
    
    if (this.searchOverlayContainer) {
      document.body.removeChild(this.searchOverlayContainer);
    }
    if (this.suggestionsContainer) {
      document.body.removeChild(this.suggestionsContainer);
    }

    const styles = document.getElementById('macro-overlay-styles');
    if (styles) {
      document.head.removeChild(styles);
    }
  }
}

// Export singleton instance
export const keyboardOverlayManager = new KeyboardOverlayManager();