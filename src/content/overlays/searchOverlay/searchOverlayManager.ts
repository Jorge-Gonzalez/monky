import React from 'react';
import { Macro, EditableEl } from '../../../types';
import { MacroSearchOverlay } from './ui/MacroSearchOverlay';
import { createReactRenderer } from '../services/reactRenderer';
import { createFocusManager } from '../services/focusManager';
import { createStyleInjector } from '../services/styleInjector';
import { SEARCH_OVERLAY_STYLES } from './searchOverlayStyles';
import { getActiveEditable } from '../../macroEngine/replacement/editableUtils';

export function createSearchOverlayManager() {
  const renderer = createReactRenderer('macro-search-overlay');
  const focusManager = createFocusManager();
  const styleInjector = createStyleInjector('macro-search-overlay-styles', SEARCH_OVERLAY_STYLES);

  let isVisible = false;
  let position = { x: 0, y: 0 };

  // Callback for when a macro is selected - should be set by coordinator
  let onMacroSelectedCallback: ((macro: Macro, element: EditableEl) => void) | null = null;

  const handleMacroSelection = (macro: Macro): void => {
    const targetElement = focusManager.getSavedState()?.element ?? null;

    if (!targetElement) {
      focusManager.clear();
      return;
    }

    const editableElement = getActiveEditable(targetElement);

    if (!editableElement) {
      focusManager.clear();
      return;
    }

    focusManager.clear();

    // If we have a callback registered (from the detector), use it for proper undo tracking
    if (onMacroSelectedCallback) {
      onMacroSelectedCallback(macro, editableElement);
    }

    const event = new CustomEvent('macro-search-selected', {
      detail: { macro },
    });
    document.dispatchEvent(event);
  };

  const initialize = (): void => {
    styleInjector.inject();
    renderer.initialize();
  };

  const show = (x?: number, y?: number): void => {
    if (x !== undefined && y !== undefined) {
      position = { x, y };
    }

    focusManager.saveFocus();
    isVisible = true;

    renderer.render(
      React.createElement(MacroSearchOverlay, {
        isVisible: true,
        position,
        onClose: hide,
        onSelectMacro: (macro: Macro) => {
          hide();
          handleMacroSelection(macro);
        },
      })
    );
  };

  const hide = (): void => {
    if (!isVisible) return;

    isVisible = false;
    renderer.clear();
    focusManager.restoreFocus();
  };

  const getVisibility = (): boolean => isVisible;

  const destroy = (): void => {
    hide();
    renderer.destroy();
    styleInjector.remove();
  };

  const setOnMacroSelected = (callback: (macro: Macro, element: EditableEl) => void) => {
    onMacroSelectedCallback = callback;
  };

  initialize();

  return {
    show,
    hide,
    isVisible: getVisibility,
    destroy,
    setOnMacroSelected,
  };
}

export type SearchOverlayManager = ReturnType<typeof createSearchOverlayManager>;