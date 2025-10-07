import React from 'react';
import { Macro } from '../../../types';
import { MacroSearchOverlay } from '../../MacroSearchOverlay/ui/MacroSearchOverlay';
import { createReactRenderer } from '../services/reactRenderer';
import { createFocusManager } from '../services/focusManager';
import { createMacroInserter } from '../services/macroInserter';
import { createStyleInjector } from '../services/styleInjector';
import { SEARCH_OVERLAY_STYLES } from './searchOverlayStyles';

export function createSearchOverlayManager() {
  const renderer = createReactRenderer('macro-search-overlay');
  const focusManager = createFocusManager();
  const macroInserter = createMacroInserter(focusManager);
  const styleInjector = createStyleInjector('macro-search-overlay-styles', SEARCH_OVERLAY_STYLES);

  let isVisible = false;
  let position = { x: 0, y: 0 };

  const handleMacroSelection = (macro: Macro): void => {
    const targetElement = focusManager.getSavedState()?.element ?? null;
    focusManager.clear();
    macroInserter.insertMacro(macro, targetElement);

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

  initialize();

  return {
    show,
    hide,
    isVisible: getVisibility,
    destroy,
  };
}

export type SearchOverlayManager = ReturnType<typeof createSearchOverlayManager>;