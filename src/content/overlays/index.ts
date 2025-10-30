import { createSearchOverlayManager } from './searchOverlay/searchOverlayManager';
import { createSuggestionsOverlayManager } from './suggestionsOverlay';
import { createSearchCoordinator, SearchCoordinator } from '../coordinators/SearchCoordinator';
import { createSuggestionsCoordinator, SuggestionsCoordinator } from '../coordinators/SuggestionsCoordinator';
import { Macro } from '../../types';

// Create managers (private, only used by coordinators)
const searchOverlayManager = createSearchOverlayManager();
const suggestionsOverlayManager = createSuggestionsOverlayManager([]);

// Create and export singleton coordinators (public API)
export const searchCoordinator: SearchCoordinator = createSearchCoordinator(searchOverlayManager);
export const suggestionsCoordinator: SuggestionsCoordinator = createSuggestionsCoordinator(suggestionsOverlayManager);

// Convenience function for updating macros
export function updateAllMacros(macros: Macro[]): void {
  suggestionsCoordinator.setMacros(macros);
}

// Convenience function for cleanup
export function destroyAllOverlays(): void {
  searchCoordinator.destroy();
  suggestionsCoordinator.destroy();
}