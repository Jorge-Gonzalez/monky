import { EditableEl, Macro } from '../../types';
import { SuggestionsOverlayManager } from '../overlays/suggestionsOverlay/SuggestionsOverlayManager';
import { getActiveEditable, getCursorCoordinates } from '../macroEngine/replacement/editableUtils';
import { DetectorActions } from '../actions/detectorActions';

export function createSuggestionsCoordinator(
  manager: SuggestionsOverlayManager
): SuggestionsCoordinator {
  let isEnabled = true;
  let lastBuffer = '';
  let currentMacros: Macro[] = [];

  /**
   * Set macros for the coordinator
   */
  const setMacros = (macros: Macro[]): void => {
    currentMacros = [...macros];
    manager.updateMacros(macros);
  };

  // Create the detector actions object
  const detectorActions: DetectorActions = {
    onDetectionStarted(buffer: string, position?: { x: number; y: number }) {
      // Use the current buffer instead of extracting from element
      lastBuffer = buffer;

      // DISABLED: fuzzy filter overlay on typing start
      // const coords = position || getCursorCoordinates() || { x: 0, y: 0 };
      // manager.show(buffer, coords.x, coords.y);
    },

    onDetectionUpdated(buffer: string, position?: { x: number; y: number }) {
      lastBuffer = buffer;

      // DISABLED: fuzzy filter overlay updates while typing
      // if (manager.isVisible()) {
      //   const coords = position || getCursorCoordinates() || { x: 0, y: 0 };
      //   manager.show(buffer, coords.x, coords.y);
      // }
    },

    onDetectionCancelled() {
      lastBuffer = '';
      manager.hide();
    },

    onMacroCommitted(macroId: string) {
      lastBuffer = '';
      manager.hide();
    },

    onCommitRequested(buffer: string): boolean {
      // If the overlay is visible, return true to let the overlay handle the Enter key
      // The overlay's keyboard navigation will handle the selection
      if (manager.isVisible()) {
        return true;
      }

      // Check if we have an exact match for manual commits
      const exactMatch = currentMacros.find(m => m.command === buffer);
      return !!exactMatch;
    },

    onNavigationRequested(direction: 'up' | 'down' | 'left' | 'right'): boolean {
      // If the overlay is visible, it should handle navigation
      if (manager.isVisible()) {
        // Let the popup handle its own navigation, but prevent the detector from processing
        return true;
      }
      // If overlay is not visible, let other handlers process
      return false;
    },

    onCancelRequested(): boolean {
      if (manager.isVisible()) {
        manager.hide();
        return true;
      }
      return false;
    },

    onShowAllRequested(buffer: string, position?: { x: number; y: number }): void {
      const x = position?.x || 0;
      const y = position?.y || 0;
      manager.showAll(x, y, buffer);
    },
  };

  // Return the combined interface
  const coordinator: SuggestionsCoordinator = {
    ...detectorActions,
    attach: (): void => {
      // Add any additional document-level event listeners here if needed
      // Currently, the macro detector handles the main event flow
      document.addEventListener('click', handleClickOutside, true);
    },

    detach: (): void => {
      // Remove any document-level event listeners that were added
      document.removeEventListener('click', handleClickOutside, true);
      // Hide any visible overlays
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
      lastBuffer = '';
    },

    isEnabled: (): boolean => isEnabled,

    updateConfig: (): void => {
      // Configuration updates not supported in this version
      // All configuration comes from detector events
    },

    setMacros,

    // Public interface methods for direct overlay control
    isVisible: (): boolean => manager.isVisible(),

    hide: (): void => {
      manager.hide();
    },

    showAll: (x?: number, y?: number, buffer?: string): void => {
      if (!isEnabled) return;
      manager.showAll(x, y, buffer);
    },

    setOnMacroSelected: (callback: (macro: Macro, buffer: string, element: EditableEl) => void): void => {
      manager.setOnMacroSelected(callback);
    },

    destroy: (): void => {
      coordinator.detach();
      manager.destroy();
    },
  };

  return coordinator;
  
  /**
   * Handle click outside to close
   */
  function handleClickOutside(e: MouseEvent): void {
    if (!manager.isVisible()) return;

    // Check if click was inside an editable element
    const target = e.target as Element;
    const editableElement = getActiveEditable(target);
    
    if (!editableElement) {
      manager.hide();
    }
  }
}

export interface SuggestionsCoordinator extends DetectorActions {
  attach: () => void;
  detach: () => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
  updateConfig: () => void;
  setMacros: (macros: Macro[]) => void;
  // Public interface methods for direct overlay control
  isVisible: () => boolean;
  hide: () => void;
  showAll: (x?: number, y?: number, buffer?: string) => void;
  setOnMacroSelected: (callback: (macro: Macro, buffer: string, element: EditableEl) => void) => void;
  destroy: () => void;
}