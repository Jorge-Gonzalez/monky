import { createSearchOverlayManager, SearchOverlayManager } from './searchOverlay/searchOverlayManager';
import { createSuggestionsOverlayManager, SuggestionsOverlayManager } from './suggestionsOverlay';
import { Macro } from '../../types';

// Create and export singleton instances
export const searchOverlayManager: SearchOverlayManager = createSearchOverlayManager();
export const suggestionsOverlayManager: SuggestionsOverlayManager = createSuggestionsOverlayManager([]);

// Convenience function for updating macros in the manager
export function updateAllMacros(macros: Macro[]): void {
  suggestionsOverlayManager.updateMacros(macros);
}

// Convenience function for cleanup
export function destroyAllOverlays(): void {
  searchOverlayManager.destroy();
  suggestionsOverlayManager.destroy();
}