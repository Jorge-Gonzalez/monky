import { createModalManager } from './modal/modalManager';
import { createSuggestionsOverlayManager } from './suggestionsOverlay';
import { createModalCoordinator, ModalCoordinator } from '../coordinators/ModalCoordinator';
import { createSuggestionsCoordinator, SuggestionsCoordinator } from '../coordinators/SuggestionsCoordinator';
import { Macro } from '../../types';

// Create managers (private, only used by coordinators)
const modalManager = createModalManager();
const suggestionsOverlayManager = createSuggestionsOverlayManager([]);

// Create and export singleton coordinators (public API)
export const modalCoordinator: ModalCoordinator = createModalCoordinator(modalManager);
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