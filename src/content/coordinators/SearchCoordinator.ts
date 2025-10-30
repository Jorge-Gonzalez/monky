import { Macro, EditableEl } from '../../types';
import { SearchOverlayManager } from '../overlays/searchOverlay/searchOverlayManager';

export function createSearchCoordinator(
  manager: SearchOverlayManager
): SearchCoordinator {
  let isEnabled = true;

  /**
   * Show the search overlay at the current cursor position or specified coordinates
   */
  const show = (x?: number, y?: number): void => {
    if (!isEnabled) return;
    manager.show(x, y);
  };

  /**
   * Hide the search overlay
   */
  const hide = (): void => {
    manager.hide();
  };

  /**
   * Check if the search overlay is currently visible
   */
  const isVisible = (): boolean => {
    return manager.isVisible();
  };

  /**
   * Set the callback for when a macro is selected from the search overlay
   */
  const setOnMacroSelected = (callback: (macro: Macro, element: EditableEl) => void): void => {
    manager.setOnMacroSelected(callback);
  };

  /**
   * Handle click outside to close the overlay
   */
  const handleClickOutside = (e: MouseEvent): void => {
    if (!manager.isVisible()) return;

    const target = e.target as Element;
    const overlayElement = document.getElementById('macro-search-overlay');

    // Check if click was inside the overlay
    if (overlayElement && overlayElement.contains(target)) {
      return;
    }

    manager.hide();
  };

  /**
   * Handle escape key to close the overlay
   */
  const handleEscapeKey = (e: KeyboardEvent): void => {
    if (!manager.isVisible()) return;

    if (e.key === 'Escape') {
      manager.hide();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const coordinator: SearchCoordinator = {
    show,
    hide,
    isVisible,
    setOnMacroSelected,

    attach: (): void => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleEscapeKey, true);
    },

    detach: (): void => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscapeKey, true);
      manager.hide();
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

export interface SearchCoordinator {
  show: (x?: number, y?: number) => void;
  hide: () => void;
  isVisible: () => boolean;
  setOnMacroSelected: (callback: (macro: Macro, element: EditableEl) => void) => void;
  attach: () => void;
  detach: () => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
  destroy: () => void;
}
