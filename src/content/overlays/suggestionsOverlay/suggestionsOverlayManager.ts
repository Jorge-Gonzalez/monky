import React from 'react';
import { Macro } from '../../../types';
import { MacroSuggestions } from '../../MacroSuggestions';
import { createReactRenderer } from '../services/reactRenderer';
import { createStyleInjector } from '../services/styleInjector';
import { SUGGESTIONS_OVERLAY_STYLES } from './suggestionsOverlayStyles';

export function createSuggestionsOverlayManager(macros: Macro[]) {
  const renderer = createReactRenderer('macro-suggestions');
  const styleInjector = createStyleInjector('macro-suggestions-styles', SUGGESTIONS_OVERLAY_STYLES);

  let isVisible = false;
  let position = { x: 0, y: 0 };
  let selectedIndex = 0;
  let currentBuffer = '';
  let currentMacros = macros;

  const getMatchingMacros = (buffer: string): Macro[] => {
    return currentMacros
      .filter(macro => macro.command.toLowerCase().startsWith(buffer.toLowerCase()))
      .slice(0, 5);
  };

  const renderSuggestions = (): void => {
    renderer.render(
      React.createElement(MacroSuggestions, {
        macros: currentMacros,
        buffer: currentBuffer,
        position,
        isVisible: true,
        selectedIndex,
        onSelectMacro: (macro: Macro) => {
          hide();
          const event = new CustomEvent('macro-suggestion-selected', {
            detail: { macro },
          });
          document.dispatchEvent(event);
        },
      })
    );
  };

  const initialize = (): void => {
    styleInjector.inject();
    renderer.initialize();
  };

  const show = (buffer: string, x?: number, y?: number): void => {
    if (x !== undefined && y !== undefined) {
      position = { x, y };
    }

    currentBuffer = buffer;
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
      const event = new CustomEvent('macro-suggestion-selected', {
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
    hide,
    navigate,
    selectCurrent,
    updateMacros,
    isVisible: getVisibility,
    destroy,
  };
}

export type SuggestionsOverlayManager = ReturnType<typeof createSuggestionsOverlayManager>;