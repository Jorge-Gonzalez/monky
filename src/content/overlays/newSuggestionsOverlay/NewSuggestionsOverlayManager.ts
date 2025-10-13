import React from 'react';
import { Macro, EditableEl } from '../../../types';
import { NewMacroSuggestions } from './ui/NewMacroSuggestions';
import { createReactRenderer } from '../services/reactRenderer';
import { createStyleInjector } from '../services/styleInjector';
import { NEW_SUGGESTIONS_OVERLAY_STYLES } from './NewSuggestionsOverlayStyles';
import { getActiveEditable, getSelection, replaceText } from '../../detector/editableUtils';

interface SavedState {
  element: EditableEl | null;
  trigger: string;
}
  
export function createNewSuggestionsOverlayManager(macros: Macro[]) {
  const renderer = createReactRenderer('new-macro-suggestions');
  const styleInjector = createStyleInjector('new-macro-suggestions-styles', NEW_SUGGESTIONS_OVERLAY_STYLES);

  let currentSelectedIndex = 0;
  let isVisible = false;
  let cursorPosition = { x: 0, y: 0 };
  let currentBuffer = '';
  let showAllMode = false; // Flag to show all macros regardless of buffer
  let currentMacros = macros;
  let savedState: SavedState | null = null;

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
        onSelectMacro: (macro: Macro) => {
          handleSelect(macro);
        },
        onClose: () => {
          hide();
        },
        onSelectedIndexChange: (index: number) => {
          currentSelectedIndex = index;
        },
        showAll: showAllMode
      })
    );
  };

  const handleSelect = (macro: Macro) => {
    if (savedState?.element) {
      if (showAllMode || !savedState.trigger) {
        // In showAll mode, insert macro at current cursor position
        const selection = getSelection(savedState.element);
        if (selection) {
          replaceText(savedState.element, macro, selection.start, selection.end);
        }
      } else {
        // In regular mode, replace the trigger text with macro
        const triggerIndex = (savedState.element.value || savedState.element.textContent || '').lastIndexOf(savedState.trigger);
        if (triggerIndex !== -1) {
          replaceText(savedState.element, macro, triggerIndex, triggerIndex + savedState.trigger.length);
        }
      }
    }
    hide();
  };

  const initialize = (): void => {
    styleInjector.inject();
    renderer.initialize();
  };

  const showAll = (x?: number, y?: number): void => {
    if (x !== undefined && y !== undefined) {
      cursorPosition = { x, y };
    }
    saveState('');
    showAllMode = true;
    currentBuffer = ''; // Empty buffer for show-all mode
    isVisible = true;
    renderSuggestions();
  };

  const show = (buffer: string, x?: number, y?: number): void => {
    if (x !== undefined && y !== undefined) {
      cursorPosition = { x, y };
    }
    saveState(buffer);
    currentBuffer = buffer;
    showAllMode = false;
    isVisible = true;
    renderSuggestions();
  };

  const hide = (): void => {
    if (!isVisible) return;
    isVisible = false;
    currentBuffer = '';
    renderer.clear();
    restoreFocus();
    savedState = null;
  };

  const saveState = (trigger: string) => {
    const activeElement = getActiveEditable(document.activeElement);
    savedState = { element: activeElement, trigger };
  };

  const restoreFocus = (delay = 10) => {
    if (!savedState?.element || !document.body.contains(savedState.element)) {
      return;
    }
    setTimeout(() => {
      if (savedState?.element) {
        savedState.element.focus();
        // Ensure cursor is positioned at the end of the inserted text
        if (savedState.element instanceof HTMLInputElement || savedState.element instanceof HTMLTextAreaElement) {
          const length = savedState.element.value.length;
          savedState.element.setSelectionRange(length, length);
        }
      }
    }, delay);
  };

  const selectCurrent = (): boolean => {
    if (!isVisible) return false;
    const matchingMacros = getMatchingMacros(currentBuffer);
    const selectedMacro = matchingMacros[currentSelectedIndex];
    if (selectedMacro) {
      handleSelect(selectedMacro);
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
  selectCurrent: () => boolean;
  updateMacros: (newMacros: Macro[]) => void;
  isVisible: () => boolean;
  destroy: () => void;
}