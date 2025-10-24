import { createSearchOverlayManager, SearchOverlayManager } from './searchOverlay/searchOverlayManager';
import { createNewSuggestionsOverlayManager, NewSuggestionsOverlayManager } from './newSuggestionsOverlay';
import { Macro } from '../../types';

// Create and export singleton instances
export const searchOverlayManager: SearchOverlayManager = createSearchOverlayManager();
export const newSuggestionsOverlayManager: NewSuggestionsOverlayManager = createNewSuggestionsOverlayManager([]);

// Convenience function for updating macros in the manager
export function updateAllMacros(macros: Macro[]): void {
  newSuggestionsOverlayManager.updateMacros(macros);
}

// Convenience function for cleanup
export function destroyAllOverlays(): void {
  searchOverlayManager.destroy();
  newSuggestionsOverlayManager.destroy();
}