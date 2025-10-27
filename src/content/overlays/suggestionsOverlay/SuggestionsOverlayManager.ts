import React from 'react';
import { Macro, EditableEl } from '../../../types';
import { MacroSuggestions } from './ui/MacroSuggestions';
import { createReactRenderer } from '../services/reactRenderer';
import { createStyleInjector } from '../services/styleInjector';
import { SUGGESTIONS_OVERLAY_STYLES } from './SuggestionsOverlayStyles';
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

export function createSuggestionsOverlayManager(macros: Macro[]) {
  const renderer = createReactRenderer('macro-suggestions');
  const styleInjector = createStyleInjector('macro-suggestions-styles', SUGGESTIONS_OVERLAY_STYLES);

  let currentMacros = macros;
  let savedState: SavedState | null = null;
  let overlayState: OverlayState = {
    isVisible: false,
    cursorPosition: { x: 0, y: 0 },
    placement: 'bottom',
    mode: 'filter',
    filterBuffer: '',
  };

  // Callback for when a macro is selected - should be set by coordinator
  let onMacroSelectedCallback: ((macro: Macro, buffer: string, element: EditableEl) => void) | null = null;

  const renderSuggestions = (): void => {
    renderer.render(
      React.createElement(MacroSuggestions, {
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

    const trigger = savedState.trigger;
    const element = savedState.element;

    // If we have a callback registered (from the detector), use it for proper undo tracking
    if (onMacroSelectedCallback && trigger && element) {
      onMacroSelectedCallback(macro, trigger, element);
      hide();
      return;
    }

    // Fallback to direct replacement (shouldn't happen in normal flow, but keeps backwards compatibility)
    if (!element) {
      hide();
      return;
    }

    if (overlayState.mode === 'showAll' && trigger) {
      const content = (element as any).value || element.textContent || '';
      const triggerIndex = content.lastIndexOf(trigger);
      if (triggerIndex !== -1) {
        replaceText(element, macro, triggerIndex, triggerIndex + trigger.length);
      } else {
        const selection = getSelection(element);
        if (selection) {
          replaceText(element, macro, selection.start, selection.end);
        }
      }
    } else if (!trigger) {
      const selection = getSelection(element);
      if (selection) {
        replaceText(element, macro, selection.start, selection.end);
      }
    } else {
      const content = (element as any).value || element.textContent || '';
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

  const restoreTimers = new Set<number>();
  const clearRestoreTimers = () => {
    restoreTimers.forEach(t => clearTimeout(t));
    restoreTimers.clear();
  };

  const restoreFocus = (element: EditableEl | null, delay = 10) => {
    if (!element || !document.body.contains(element)) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (element && (element as any).isConnected) {
        element.focus();

        // Ensure cursor is positioned at the end of the content
        if (element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement) {
          const length = element.value.length;
          element.setSelectionRange(length, length);
        } else if (element instanceof HTMLElement && (element.isContentEditable || element.contentEditable === 'true')) {
          const range = document.createRange();
          range.selectNodeContents(element);
          range.collapse(false);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
      restoreTimers.delete(timer);
    }, delay);
    restoreTimers.add(timer);
  };

  const initialize = (): void => {
    styleInjector.inject();
    renderer.initialize();
  };

  const showAll = (x?: number, y?: number, buffer?: string): void => {
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
      filterBuffer: buffer || '', // Use the provided buffer for fuzzy filtering
    };
    
    // In showAll mode, save the buffer as the trigger so we know what to replace
    // The buffer (e.g., "/si") is what should be replaced when a macro is selected
    savedState = { element: activeElement, trigger: buffer || '' };
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
    const elementToFocus = savedState?.element;
    const wasShowAllMode = overlayState.mode === 'showAll';
    
    overlayState = {
      ...overlayState,
      isVisible: false,
      filterBuffer: '',
    };
    renderer.clear();
    
    // Only restore focus if we're not in showAll mode to avoid interfering
    // with ongoing macro detection
    if (!wasShowAllMode) {
      restoreFocus(elementToFocus);
    }
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

  const setOnMacroSelected = (callback: (macro: Macro, buffer: string, element: EditableEl) => void) => {
    onMacroSelectedCallback = callback;
  };

  initialize();

  return {
    show,
    showAll,
    hide,
    updateMacros,
    isVisible: getVisibility,
    destroy,
    setOnMacroSelected,
  };
}

export interface SuggestionsOverlayManager {
  show: (buffer: string, x?: number, y?: number) => void;
  showAll: (x?: number, y?: number, buffer?: string) => void;
  hide: () => void;
  updateMacros: (newMacros: Macro[]) => void;
  isVisible: () => boolean;
  destroy: () => void;
  setOnMacroSelected: (callback: (macro: Macro, buffer: string, element: EditableEl) => void) => void;
}