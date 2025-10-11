import React from 'react';
import { Macro } from '../../../types';
import { NewMacroSuggestions } from './ui/NewMacroSuggestions';
import { createReactRenderer } from '../services/reactRenderer';
import { createStyleInjector } from '../services/styleInjector';
import { NEW_SUGGESTIONS_OVERLAY_STYLES } from './NewSuggestionsOverlayStyles';

export function createNewSuggestionsOverlayManager(macros: Macro[]) {
  const renderer = createReactRenderer('new-macro-suggestions');
  const styleInjector = createStyleInjector('new-macro-suggestions-styles', NEW_SUGGESTIONS_OVERLAY_STYLES);

  let isVisible = false;
  let cursorPosition = { x: 0, y: 0 };
  let selectedIndex = 0;
  let currentBuffer = '';
  let showAllMode = false; // Flag to show all macros regardless of buffer
  let currentMacros = macros;

  const getMatchingMacros = (buffer: string): Macro[] => {
    return currentMacros
      .filter(macro => 
        macro.command.toLowerCase().startsWith(buffer.toLowerCase()) ||
        macro.command.toLowerCase().includes(buffer.toLowerCase())
      )
      .slice(0, 5);
  };

  const renderSuggestions = (): void => {
    renderer.render(
      React.createElement(NewMacroSuggestions, {
        macros: currentMacros, // Pass all macros to the component
        buffer: currentBuffer,
        cursorPosition,
        isVisible,
        selectedIndex,
        onSelectMacro: (macro: Macro) => {
          hide();
          const event = new CustomEvent('new-macro-suggestion-selected', {
            detail: { macro },
          });
          document.dispatchEvent(event);
        },
        onClose: () => {
          hide();
        },
        showAll: showAllMode
      })
    );
  };

  const initialize = (): void => {
    styleInjector.inject();
    renderer.initialize();
  };

  // Separate method for toggling visibility (for the system macro)
  const showAll = (x?: number, y?: number): void => {
    if (x !== undefined && y !== undefined) {
      cursorPosition = { x, y };
    }

    showAllMode = true;
    currentBuffer = ''; // Empty buffer for show-all mode
    selectedIndex = 0;
    isVisible = true;

    renderSuggestions();
  };

  const show = (buffer: string, x?: number, y?: number): void => {
    if (x !== undefined && y !== undefined) {
      cursorPosition = { x, y };
    }

    // For regular showing, always disable showAllMode and use buffer
    currentBuffer = buffer;
    showAllMode = false;

    selectedIndex = 0;
    isVisible = true;

    renderSuggestions();
  };

  const hide = (): void => {
    if (!isVisible) return;

    isVisible = false;
    selectedIndex = 0;
    currentBuffer = '';
    renderer.clear();
  };

  const navigate = (direction: 'up' | 'down'): boolean => {
    if (!isVisible) return false;

    const matching = getMatchingMacros(currentBuffer);
    if (matching.length === 0) return false;

    if (direction === 'down') {
      selectedIndex = (selectedIndex + 1) % matching.length;
    } else {
      selectedIndex = selectedIndex === 0 ? matching.length - 1 : selectedIndex - 1;
    }

    renderSuggestions();
    return true;
  };

  const selectCurrent = (): boolean => {
    if (!isVisible) return false;

    const matching = getMatchingMacros(currentBuffer);
    const selected = matching[selectedIndex];

    if (selected) {
      hide();
      const event = new CustomEvent('new-macro-suggestion-selected', {
        detail: { macro: selected },
      });
      document.dispatchEvent(event);
      return true;
    }

    return false;
  };

  const updateMacros = (newMacros: Macro[]): void => {
    currentMacros = newMacros;
    if (isVisible) {
      renderSuggestions();
    }
  };

  const getVisibility = (): boolean => isVisible;

  const destroy = (): void => {
    hide();
    renderer.destroy();
    styleInjector.remove();
  };

  initialize();

  return {
    show,
    showAll,
    hide,
    navigate,
    selectCurrent,
    updateMacros,
    isVisible: getVisibility,
    destroy,
  };
}

export interface NewSuggestionsOverlayManager {
  show: (buffer: string, x?: number, y?: number) => void;
  showAll: (x?: number, y?: number) => void;
  hide: () => void;
  navigate: (direction: 'up' | 'down') => boolean;
  selectCurrent: () => boolean;
  updateMacros: (newMacros: Macro[]) => void;
  isVisible: () => boolean;
  destroy: () => void;
}