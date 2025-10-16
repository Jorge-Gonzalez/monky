import React from 'react';
import { Macro, EditableEl } from '../../../types';
import { NewMacroSuggestions } from './ui/NewMacroSuggestions';
import { createReactRenderer } from '../services/reactRenderer';
import { createStyleInjector } from '../services/styleInjector';
import { NEW_SUGGESTIONS_OVERLAY_STYLES } from './NewSuggestionsOverlayStyles';
import { getActiveEditable, getSelection, replaceText } from '../../detector/editableUtils';
import { getCaretCoordinates } from './utils/caretPosition';

interface SavedState {
  element: EditableEl | null;
  trigger: string;
}

interface OverlayState {
  isVisible: boolean;
  cursorPosition: { x: number; y: number };
  mode: 'filter' | 'showAll';
  filterBuffer: string;
}

export function createNewSuggestionsOverlayManager(macros: Macro[]) {
  const renderer = createReactRenderer('new-macro-suggestions');
  const styleInjector = createStyleInjector('new-macro-suggestions-styles', NEW_SUGGESTIONS_OVERLAY_STYLES);

  let currentMacros = macros;
  let savedState: SavedState | null = null;
  let overlayState: OverlayState = {
    isVisible: false,
    cursorPosition: { x: 0, y: 0 },
    mode: 'filter',
    filterBuffer: '',
  };

  const renderSuggestions = (): void => {
    renderer.render(
      React.createElement(NewMacroSuggestions, {
        macros: currentMacros,
        filterBuffer: overlayState.filterBuffer,
        mode: overlayState.mode,
        cursorPosition: overlayState.cursorPosition,
        isVisible: overlayState.isVisible,
        onSelectMacro: handleSelect,
        onClose: hide,
        placement: 'bottom',
      })
    );
  };

  const handleSelect = (macro: Macro) => {
    if (!savedState?.element) {
      hide();
      return;
    }

    const element = savedState.element;
    const trigger = savedState.trigger;

    if (overlayState.mode === 'showAll' || !trigger) {
      // In showAll mode, insert macro at current cursor position
      const selection = getSelection(element);
      if (selection) {
        replaceText(element, macro, selection.start, selection.end);
      }
    } else {
      // In filter mode, replace the trigger text with macro
      const content = element.value || element.textContent || '';
      const triggerIndex = content.lastIndexOf(trigger);
      if (triggerIndex !== -1) {
        replaceText(element, macro, triggerIndex, triggerIndex + trigger.length);
      }
    }

    hide();
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
        
        // Ensure cursor is positioned at the end of the content
        if (savedState.element instanceof HTMLInputElement || 
            savedState.element instanceof HTMLTextAreaElement) {
          const length = savedState.element.value.length;
          savedState.element.setSelectionRange(length, length);
        }
      }
    }, delay);
  };

  const initialize = (): void => {
    styleInjector.inject();
    renderer.initialize();
  };

  const showAll = (x?: number, y?: number): void => {
    const activeElement = getActiveEditable(document.activeElement);
    if (!activeElement) {
      console.warn('No active element found');
      return;
    }

    // Calculate cursor position if not provided
    let cursorX = x;
    let cursorY = y;
    
    if (cursorX === undefined || cursorY === undefined) {
      console.log('Calculating caret position for showAll...');
      const coords = getCaretCoordinates(activeElement);
      if (coords) {
        cursorX = coords.x;
        cursorY = coords.y;
        console.log('Caret position calculated:', coords);
      } else {
        // Fallback to element position if caret detection fails
        console.warn('Caret detection failed, using element position');
        const rect = activeElement.getBoundingClientRect();
        cursorX = rect.left + window.scrollX;
        cursorY = rect.bottom + window.scrollY;
      }
    }

    overlayState = {
      isVisible: true,
      cursorPosition: { x: cursorX, y: cursorY },
      mode: 'showAll',
      filterBuffer: '',
    };
    
    saveState('');
    renderSuggestions();
  };

  const show = (buffer: string, x?: number, y?: number): void => {
    const activeElement = getActiveEditable(document.activeElement);
    if (!activeElement) {
      console.warn('No active element found');
      return;
    }

    // Calculate cursor position if not provided
    let cursorX = x;
    let cursorY = y;
    
    if (cursorX === undefined || cursorY === undefined) {
      console.log('Calculating caret position for show...');
      const coords = getCaretCoordinates(activeElement);
      if (coords) {
        cursorX = coords.x;
        cursorY = coords.y;
        console.log('Caret position calculated:', coords);
      } else {
        // Fallback to element position if caret detection fails
        console.warn('Caret detection failed, using element position');
        const rect = activeElement.getBoundingClientRect();
        cursorX = rect.left + window.scrollX;
        cursorY = rect.bottom + window.scrollY;
      }
    }

    overlayState = {
      isVisible: true,
      cursorPosition: { x: cursorX, y: cursorY },
      mode: 'filter',
      filterBuffer: buffer,
    };
    
    saveState(buffer);
    renderSuggestions();
  };

  const hide = (): void => {
    if (!overlayState.isVisible) return;
    
    overlayState = {
      ...overlayState,
      isVisible: false,
      filterBuffer: '',
    };
    
    renderer.clear();
    restoreFocus();
    savedState = null;
  };

  const updateMacros = (newMacros: Macro[]): void => {
    currentMacros = newMacros;
    if (overlayState.isVisible) {
      renderSuggestions();
    }
  };

  const getVisibility = (): boolean => overlayState.isVisible;

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
    updateMacros,
    isVisible: getVisibility,
    destroy,
  };
}

export interface NewSuggestionsOverlayManager {
  show: (buffer: string, x?: number, y?: number) => void;
  showAll: (x?: number, y?: number) => void;
  hide: () => void;
  updateMacros: (newMacros: Macro[]) => void;
  isVisible: () => boolean;
  destroy: () => void;
}