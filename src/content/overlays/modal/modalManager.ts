import React from 'react';
import { Macro, EditableEl } from '../../../types';
import { ModalView } from './types';
import { ModalShell } from './ui/ModalShell';
import { MacroSearchView } from '../views/search/ui/MacroSearchView';
import { SettingsView } from '../views/settings/ui/SettingsView';
import { MacroEditorView } from '../views/macroEditor/ui/MacroEditorView';
import { createReactRenderer } from '../services/reactRenderer';
import { createFocusManager } from '../services/focusManager';
import { createStyleInjector } from '../services/styleInjector';
import { getActiveEditable } from '../../macroEngine/replacement/editableUtils';
import { MODAL_STYLES } from './modalStyles';
import { SEARCH_VIEW_STYLES } from '../views/search/searchViewStyles';
import { SETTINGS_VIEW_STYLES } from '../views/settings/settingsViewStyles';
import { EDITOR_VIEW_STYLES } from '../views/macroEditor/editorViewStyles';

/**
 * Unified modal manager that handles all modal views
 */
export function createModalManager() {
  const renderer = createReactRenderer('monky-modal');
  const focusManager = createFocusManager();

  // Combine all styles
  const allStyles = [
    MODAL_STYLES,
    SEARCH_VIEW_STYLES,
    SETTINGS_VIEW_STYLES,
    EDITOR_VIEW_STYLES,
  ].join('\n');

  const styleInjector = createStyleInjector('monky-modal-styles', allStyles);

  let isVisible = false;
  let currentView: ModalView = 'search';
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

  const renderView = (): React.ReactElement => {
    const viewProps = {
      onClose: hide,
      onViewChange: switchView,
    };

    switch (currentView) {
      case 'search':
        return React.createElement(MacroSearchView, {
          ...viewProps,
          onSelectMacro: (macro: Macro) => {
            hide();
            handleMacroSelection(macro);
          },
        });
      case 'settings':
        return React.createElement(SettingsView, viewProps);
      case 'editor':
        return React.createElement(MacroEditorView, viewProps);
      default:
        return React.createElement(MacroSearchView, {
          ...viewProps,
          onSelectMacro: (macro: Macro) => {
            hide();
            handleMacroSelection(macro);
          },
        });
    }
  };

  const renderModal = (): void => {
    const viewContent = renderView();

    renderer.render(
      React.createElement(ModalShell, {
        isVisible: true,
        onClose: hide,
        currentView,
        onViewChange: switchView,
        children: viewContent,
      })
    );
  };

  const initialize = (): void => {
    styleInjector.inject();
    renderer.initialize();
  };

  const show = (view?: ModalView, x?: number, y?: number): void => {
    if (view) {
      currentView = view;
    }

    if (x !== undefined && y !== undefined) {
      position = { x, y };
    }

    focusManager.saveFocus();
    isVisible = true;

    renderModal();
  };

  const hide = (): void => {
    if (!isVisible) return;

    isVisible = false;
    renderer.clear();
    focusManager.restoreFocus();
  };

  const switchView = (view: ModalView): void => {
    if (currentView === view) return;

    currentView = view;
    if (isVisible) {
      renderModal();
    }
  };

  const getVisibility = (): boolean => isVisible;

  const getCurrentView = (): ModalView | null => {
    return isVisible ? currentView : null;
  };

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
    switchView,
    isVisible: getVisibility,
    getCurrentView,
    destroy,
    setOnMacroSelected,
  };
}

export type ModalManager = ReturnType<typeof createModalManager>;
