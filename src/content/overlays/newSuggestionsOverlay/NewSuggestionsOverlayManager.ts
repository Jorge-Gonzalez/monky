import React from 'react';
import { Macro, EditableEl } from '../../../types';
import { NewMacroSuggestions } from './ui/NewMacroSuggestions';
import { createReactRenderer } from '../services/reactRenderer';
import { createStyleInjector } from '../services/styleInjector';
import { NEW_SUGGESTIONS_OVERLAY_STYLES } from './NewSuggestionsOverlayStyles';
import { getActiveEditable, getSelection, replaceText } from '../../detector/editableUtils';
import { getCaretCoordinates } from './utils/caretPosition';
import { calculateOptimalPosition } from './utils/popupPositioning';

interface SavedState {
  element: EditableEl | null;
  trigger: string;
}

interface OverlayState {
  isVisible: boolean;
  cursorPosition: { x: number; y: number };
  placement: 'top' | 'bottom';
  mode: 'filter' | 'showAll';
  filterBuffer: string;
}

// Estimated popup dimensions (used for positioning calculations)
const POPUP_ESTIMATED_WIDTH = 300;
const POPUP_ESTIMATED_HEIGHT = 75; // Adjust based on your typical popup height

export function createNewSuggestionsOverlayManager(macros: Macro[]) {
  const renderer = createReactRenderer('new-macro-suggestions');
  const styleInjector = createStyleInjector('new-macro-suggestions-styles', NEW_SUGGESTIONS_OVERLAY_STYLES);

  let currentMacros = macros;
  let savedState: SavedState | null = null;
  let overlayState: OverlayState = {
    isVisible: false,
    cursorPosition: { x: 0, y: 0 },
    placement: 'bottom',
    mode: 'filter',
    filterBuffer: '',
  };

  const renderSuggestions = (): void => {
    renderer.render(
      React.createElement(NewMacroSuggestions, {
        macros: currentMacros,
        filterBuffer: overlayState.filterBuffer,
        mode: overlayState.mode,
        position: overlayState.cursorPosition,
        placement: overlayState.placement,
        isVisible: overlayState.isVisible,
        onSelectMacro: handleSelect,
        onClose: hide,
      })
    );
  };

  const calculatePosition = (caretCoords: { x: number; y: number }) => {
    const windowSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const popupDimensions = {
      width: POPUP_ESTIMATED_WIDTH,
      height: POPUP_ESTIMATED_HEIGHT,
    };


    return calculateOptimalPosition(
      caretCoords,
      windowSize,
      popupDimensions,
      { margin: 10 }
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

    let caretCoords;

    if (x !== undefined && y !== undefined) {
      // Use provided coordinates
      caretCoords = { x, y };
    } else {
      // Calculate caret position automatically
      caretCoords = getCaretCoordinates(activeElement);
      if (!caretCoords) {
        console.error('Failed to get caret coordinates');
        return;
      }
    }

    const optimalPosition = calculatePosition(caretCoords);

    overlayState = {
      isVisible: true,
      cursorPosition: { x: optimalPosition.x, y: optimalPosition.y },
      placement: optimalPosition.placement,
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

    let caretCoords;

    if (x !== undefined && y !== undefined) {
      // Use provided coordinates
      caretCoords = { x, y };
    } else {
      // Calculate caret position automatically
      caretCoords = getCaretCoordinates(activeElement);
      if (!caretCoords) {
        console.error('Failed to get caret coordinates');
        return;
      }
    }

    const optimalPosition = calculatePosition(caretCoords);

    overlayState = {
      isVisible: true,
      cursorPosition: { x: optimalPosition.x, y: optimalPosition.y },
      placement: optimalPosition.placement,
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

// This is a helper for testing purposes only and should not be used in production.
declare module './NewSuggestionsOverlayManager' {
  function createNewSuggestionsOverlayManager(macros: Macro[]): NewSuggestionsOverlayManager & {
    _test_setSavedState: (state: any) => void;
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