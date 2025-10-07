import React from 'react';
import ReactDOM from 'react-dom/client';
import { MacroSearchOverlay } from './MacroSearchOverlay/ui/MacroSearchOverlay';
import { MacroSuggestions } from './MacroSuggestions';
import { Macro, EditableEl } from '../types';
import { getActiveEditable, getSelection, replaceText } from './editableUtils';

/**
 * Manages the lifecycle and rendering of React-based UI overlays.
 * This class is a singleton responsible for creating and managing the DOM containers
 * for React components like the search overlay and suggestions popup.
 *
 * It is designed to be controlled by other parts of the content script, such as
 * `macroDetector.ts` or `systemMacros.ts`, which decide when to show or hide
 * the UI based on user input.
 */
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
        background-color: var(--shadow-color);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #macro-search-overlay .macro-search-modal {
        background-color: var(--bg-primary);
        border-radius: 8px;
        box-shadow: 0 25px 50px -12px var(--shadow-color);
        border: 1px solid var(--border-primary);
        min-width: 400px;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
      }

      #macro-search-overlay .macro-search-input-container {
        padding: 16px;
        border-bottom: 1px solid var(--border-primary);
      }

      #macro-search-overlay .macro-search-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border-input);
        border-radius: 6px;
        font-size: 14px;
        background-color: var(--bg-input);
        color: var(--text-primary);
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.15s;
      }

      #macro-search-overlay .macro-search-input:focus {
        border-color: var(--text-accent);
        box-shadow: 0 0 0 2px var(--bg-tertiary);
      }

      #macro-search-overlay .macro-search-results {
        max-height: 300px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
      }

      #macro-search-overlay .macro-search-results::-webkit-scrollbar {
        width: 8px !important;
        height: 8px !important;
      }
      #macro-search-overlay .macro-search-results::-webkit-scrollbar-track {
        background: var(--scrollbar-track) !important;
        border-radius: 4px !important;
      }
      #macro-search-overlay .macro-search-results::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb) !important;
        border-radius: 4px !important;
        border: 1px solid var(--scrollbar-track) !important;
      }
      #macro-search-overlay .macro-search-results::-webkit-scrollbar-thumb:hover {
        background: var(--scrollbar-thumb-hover) !important;
      }

      #macro-search-overlay .macro-search-empty {
        padding: 16px;
        color: var(--text-secondary);
        text-align: center;
        font-size: 14px;
      }

      #macro-search-overlay .macro-search-item {
        padding: 12px;
        border-bottom: 1px solid var(--border-secondary);
        color: var(--text-primary);
        cursor: pointer;
        transition: background-color 0.15s;
      }

      .macro-search-item:hover {
        background-color: var(--bg-secondary);
      }

      #macro-search-overlay .macro-search-item.selected {
        background-color: var(--bg-tertiary);
      }

      #macro-search-overlay .macro-search-item-command {
        font-weight: 500;
        color: var(--text-accent);
        font-size: 14px;
      }

      #macro-search-overlay .macro-search-item-text {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #macro-search-overlay .macro-search-footer {
        padding: 8px;
        border-top: 1px solid var(--border-primary);
        font-size: 12px;
        color: var(--text-secondary);
        display: flex;
        justify-content: space-between;
        background-color: var(--bg-primary);
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
      }

      #macro-search-overlay .macro-search-kbd {
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
        background-color: var(--kbd-bg);
        border: 1px solid var(--kbd-border);
        color: var(--text-primary);
        margin-left: 4px;
      }

      #macro-search-overlay .macro-search-kbd:first-child {
        margin-left: 0;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        /*
          Most dark mode styles are now handled by the CSS variables set in MacroSearchOverlay.tsx.
          The 'dark' class on the modal root element triggers the variable changes.
          This media query is kept for potential future use or for styles not covered by variables.
        */
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

  /**
   * Displays the full-screen macro search overlay.
   * This is typically triggered by a system macro (e.g., '/?').
   * It saves the currently focused element and its cursor position so that
   * focus can be restored after the overlay is closed.
   * @param x The x-coordinate for positioning (optional, currently unused for centering).
   * @param y The y-coordinate for positioning (optional, currently unused for centering).
   */
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

  /**
   * Displays the small suggestions popup near the cursor.
   * NOTE: This is intended for a future feature and is not currently called by the macro detector.
   * @param buffer The current text buffer to filter suggestions.
   * @param x The x-coordinate for positioning the popup.
   * @param y The y-coordinate for positioning the popup.
   */
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