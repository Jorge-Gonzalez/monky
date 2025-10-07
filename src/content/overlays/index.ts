import { createSearchOverlayManager, SearchOverlayManager } from './searchOverlay/searchOverlayManager';
import { createSuggestionsOverlayManager, SuggestionsOverlayManager } from './suggestionsOverlay/suggestionsOverlayManager';
import { Macro } from '../../types';

// Create and export singleton instances
export const searchOverlayManager: SearchOverlayManager = createSearchOverlayManager();
export const suggestionsOverlayManager: SuggestionsOverlayManager = createSuggestionsOverlayManager([]);

// Convenience function for updating macros in both managers
export function updateAllMacros(macros: Macro[]): void {
  suggestionsOverlayManager.updateMacros(macros);
}

// Convenience function for cleanup
export function destroyAllOverlays(): void {
  searchOverlayManager.destroy();
  suggestionsOverlayManager.destroy();
}