import { Macro, EditableEl } from '../../types';
import { ModalManager } from '../overlays/modal/modalManager';
import { ModalView } from '../overlays/modal/types';

/**
 * Unified modal coordinator that handles all modal views
 */
export function createModalCoordinator(
  manager: ModalManager
): ModalCoordinator {
  let isEnabled = true;

  /**
   * Show the modal with a specific view
   */
  const show = (view?: ModalView, x?: number, y?: number): void => {
    if (!isEnabled) return;
    manager.show(view, x, y);
  };

  /**
   * Hide the modal
   */
  const hide = (): void => {
    manager.hide();
  };

  /**
   * Switch to a different view without closing the modal
   */
  const switchView = (view: ModalView): void => {
    manager.switchView(view);
  };

  /**
   * Check if the modal is currently visible
   */
  const isVisible = (): boolean => {
    return manager.isVisible();
  };

  /**
   * Get the current view (or null if modal is closed)
   */
  const getCurrentView = (): ModalView | null => {
    return manager.getCurrentView();
  };

  /**
   * Set the callback for when a macro is selected from the search view
   */
  const setOnMacroSelected = (callback: (macro: Macro, element: EditableEl) => void): void => {
    manager.setOnMacroSelected(callback);
  };

  /**
   * Debug logger for text selection events
   */
  const logDebug = (event: string, details: any) => {
    console.log(`[ModalCoordinator] ${event}:`, details);
  };

  /**
   * Track mousedown events for debugging
   */
  const handleMouseDown = (e: MouseEvent): void => {
    if (!manager.isVisible()) return;

    const target = e.target as Element;
    const modalElement = document.getElementById('monky-modal');
    const isInsideModal = modalElement && modalElement.contains(target);
    const isToolbar = !!target.closest('.medium-editor-toolbar');

    logDebug('mousedown', {
      target: target.tagName,
      className: target.className,
      isInsideModal,
      isToolbar,
      timestamp: Date.now()
    });
  };

  /**
   * Track mouseup events for debugging
   */
  const handleMouseUp = (e: MouseEvent): void => {
    if (!manager.isVisible()) return;

    const target = e.target as Element;
    const modalElement = document.getElementById('monky-modal');
    const isInsideModal = modalElement && modalElement.contains(target);
    const selection = window.getSelection();

    logDebug('mouseup', {
      target: target.tagName,
      className: target.className,
      isInsideModal,
      hasSelection: selection ? !selection.isCollapsed : false,
      selectionText: selection ? selection.toString().substring(0, 50) : '',
      anchorNode: selection?.anchorNode?.nodeName,
      timestamp: Date.now()
    });
  };

  /**
   * Handle click outside to close the modal
   */
  const handleClickOutside = (e: MouseEvent): void => {
    if (!manager.isVisible()) return;

    const target = e.target as Element;
    const modalElement = document.getElementById('monky-modal');
    const isInsideModal = modalElement && modalElement.contains(target);
    const isToolbar = !!target.closest('.medium-editor-toolbar');
    const selection = window.getSelection();

    logDebug('click', {
      target: target.tagName,
      className: target.className,
      isInsideModal,
      isToolbar,
      hasSelection: selection ? !selection.isCollapsed : false,
      selectionText: selection ? selection.toString().substring(0, 50) : '',
      anchorNode: selection?.anchorNode?.nodeName,
      focusNode: selection?.focusNode?.nodeName,
      timestamp: Date.now()
    });

    // Check if click was inside the modal
    if (isInsideModal) {
      logDebug('click-decision', { action: 'ignore', reason: 'inside modal' });
      return;
    }

    // Check if click was on Medium Editor toolbar or its children
    if (isToolbar) {
      logDebug('click-decision', { action: 'ignore', reason: 'toolbar click' });
      return;
    }

    logDebug('click-decision', { action: 'CLOSING MODAL', reason: 'outside click' });
    manager.hide();
  };

  /**
   * Handle escape key to close the modal
   * Note: The modal itself also handles Escape via useModalKeyboard hook,
   * but we keep this for backup/consistency
   */
  const handleEscapeKey = (e: KeyboardEvent): void => {
    if (!manager.isVisible()) return;

    if (e.key === 'Escape') {
      manager.hide();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const coordinator: ModalCoordinator = {
    show,
    hide,
    switchView,
    isVisible,
    getCurrentView,
    setOnMacroSelected,

    attach: (): void => {
      document.addEventListener('mousedown', handleMouseDown, true);
      document.addEventListener('mouseup', handleMouseUp, true);
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleEscapeKey, true);
      logDebug('coordinator-attached', { timestamp: Date.now() });
    },

    detach: (): void => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscapeKey, true);
      manager.hide();
      logDebug('coordinator-detached', { timestamp: Date.now() });
    },

    enable: (): void => {
      isEnabled = true;
    },

    disable: (): void => {
      isEnabled = false;
      if (manager.isVisible()) {
        manager.hide();
      }
    },

    isEnabled: (): boolean => isEnabled,

    destroy: (): void => {
      coordinator.detach();
      manager.destroy();
    },
  };

  return coordinator;
}

export interface ModalCoordinator {
  show: (view?: ModalView, x?: number, y?: number) => void;
  hide: () => void;
  switchView: (view: ModalView) => void;
  isVisible: () => boolean;
  getCurrentView: () => ModalView | null;
  setOnMacroSelected: (callback: (macro: Macro, element: EditableEl) => void) => void;
  attach: () => void;
  detach: () => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
  destroy: () => void;
}
