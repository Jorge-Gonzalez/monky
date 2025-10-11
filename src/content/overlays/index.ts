import { createSearchOverlayManager, SearchOverlayManager } from './searchOverlay/searchOverlayManager';
import { createSuggestionsOverlayManager, SuggestionsOverlayManager } from './suggestionsOverlay/suggestionsOverlayManager';
import { createNewSuggestionsOverlayManager, NewSuggestionsOverlayManager } from './newSuggestionsOverlay';
import { Macro } from '../../types';

// Create and export singleton instances
export const searchOverlayManager: SearchOverlayManager = createSearchOverlayManager();
export const suggestionsOverlayManager: SuggestionsOverlayManager = createSuggestionsOverlayManager([]);
export const newSuggestionsOverlayManager: NewSuggestionsOverlayManager = createNewSuggestionsOverlayManager([]);

// Convenience function for updating macros in both managers
export function updateAllMacros(macros: Macro[]): void {
  suggestionsOverlayManager.updateMacros(macros);
  newSuggestionsOverlayManager.updateMacros(macros);
}

// Convenience function for cleanup
export function destroyAllOverlays(): void {
  searchOverlayManager.destroy();
  suggestionsOverlayManager.destroy();
  newSuggestionsOverlayManager.destroy();
}