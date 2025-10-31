import { createModalManager } from './modal/modalManager';
import { createSuggestionsOverlayManager } from './suggestionsOverlay';
import { createModalCoordinator, ModalCoordinator } from '../coordinators/ModalCoordinator';
import { createSuggestionsCoordinator, SuggestionsCoordinator } from '../coordinators/SuggestionsCoordinator';
import { Macro, EditableEl } from '../../types';

// Create managers (private, only used by coordinators)
const modalManager = createModalManager();
const suggestionsOverlayManager = createSuggestionsOverlayManager([]);

// Create and export singleton coordinators (public API)
export const modalCoordinator: ModalCoordinator = createModalCoordinator(modalManager);

// Legacy search coordinator - adapter for backward compatibility
// This provides the old SearchCoordinator interface while using the new modal system
export const searchCoordinator = {
  show: (x?: number, y?: number) => modalCoordinator.show('search', x, y),
  hide: () => modalCoordinator.hide(),
  isVisible: () => modalCoordinator.isVisible() && modalCoordinator.getCurrentView() === 'search',
  setOnMacroSelected: (callback: (macro: Macro, element: EditableEl) => void) =>
    modalCoordinator.setOnMacroSelected(callback),
  attach: () => modalCoordinator.attach(),
  detach: () => modalCoordinator.detach(),
  enable: () => modalCoordinator.enable(),
  disable: () => modalCoordinator.disable(),
  isEnabled: () => modalCoordinator.isEnabled(),
  destroy: () => {}, // Don't destroy the shared modal coordinator
};

export const suggestionsCoordinator: SuggestionsCoordinator = createSuggestionsCoordinator(suggestionsOverlayManager);

// Convenience function for updating macros
export function updateAllMacros(macros: Macro[]): void {
  suggestionsCoordinator.setMacros(macros);
}

// Convenience function for cleanup
export function destroyAllOverlays(): void {
  modalCoordinator.destroy();
  suggestionsCoordinator.destroy();
}