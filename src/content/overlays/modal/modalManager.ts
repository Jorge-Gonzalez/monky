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
import { ensureAppFontFace } from '../services/appFont';
import { getActiveEditable } from '../../macroEngine/replacement/editableUtils';
import { composeShadowBundle } from '../../../styles/baseBundle';
import MODAL_STYLES from './modalStyles.css?raw';
import SEARCH_VIEW_STYLES from '../views/search/searchViewStyles.css?raw';
import SETTINGS_VIEW_STYLES from '../views/settings/settingsViewStyles.css?raw';
import CONTENT_EDITOR_STYLES from '../../../styles/components/content-editor.css?raw';

export function createModalManager() {
  const renderer = createReactRenderer('monky-modal', true);
  const focusManager = createFocusManager();

  const allStyles = composeShadowBundle({
    componentStyles: [MODAL_STYLES, SEARCH_VIEW_STYLES, SETTINGS_VIEW_STYLES, CONTENT_EDITOR_STYLES],
  });

  let styleInjector: ReturnType<typeof createStyleInjector>;
  let isVisible = false;
  let currentView: ModalView = 'search';
  let editingMacro: Macro | undefined = undefined;
  let onMacroSelectedCallback: ((macro: Macro, element: EditableEl) => void) | null = null;

  const handleMacroSelection = (macro: Macro): void => {
    const targetElement = focusManager.getSavedState()?.element ?? null;
    if (!targetElement) { focusManager.clear(); return; }
    const editableElement = getActiveEditable(targetElement);
    if (!editableElement) { focusManager.clear(); return; }
    focusManager.clear();
    if (onMacroSelectedCallback) {
      onMacroSelectedCallback(macro, editableElement);
    }
    document.dispatchEvent(new CustomEvent('macro-search-selected', { detail: { macro } }));
  };

  const navigateToEditor = (macro?: Macro): void => {
    editingMacro = macro;
    currentView = 'editor';
    if (isVisible) renderModal();
  };

  const switchView = (view: ModalView): void => {
    if (currentView === view) return;
    if (view !== 'editor') editingMacro = undefined;
    currentView = view;
    if (isVisible) renderModal();
  };

  const renderView = (): React.ReactElement => {
    const viewProps = {
      onClose: hide,
      onViewChange: switchView,
      onNavigateToEditor: navigateToEditor,
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
        return React.createElement(MacroEditorView, {
          ...viewProps,
          initialMacro: editingMacro,
        });
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
    renderer.render(
      React.createElement(ModalShell, {
        isVisible: true,
        onClose: hide,
        currentView,
        onViewChange: switchView,
        children: renderView(),
      })
    );
  };

  const initialize = (): void => {
    renderer.initialize();
    const shadowRoot = renderer.getShadowRoot();
    ensureAppFontFace();
    styleInjector = createStyleInjector('monky-modal-styles', allStyles, shadowRoot);
    styleInjector.inject();
  };

  const show = (view?: ModalView, x?: number, y?: number): void => {
    if (view) currentView = view;
    if (x !== undefined && y !== undefined) {/* position unused but kept for API compat */}
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

  const getVisibility = (): boolean => isVisible;
  const getCurrentView = (): ModalView | null => isVisible ? currentView : null;

  const destroy = (): void => {
    hide();
    renderer.destroy();
    styleInjector.remove();
    // The app @font-face is shared across overlays; leave it registered.
  };

  const setOnMacroSelected = (callback: (macro: Macro, element: EditableEl) => void) => {
    onMacroSelectedCallback = callback;
  };

  initialize();

  return { show, hide, switchView, navigateToEditor, isVisible: getVisibility, getCurrentView, destroy, setOnMacroSelected };
}

export type ModalManager = ReturnType<typeof createModalManager>;
