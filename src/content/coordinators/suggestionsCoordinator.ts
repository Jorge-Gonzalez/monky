import { suggestionsOverlayManager } from '../overlays'
import { DetectorActions } from '../actions/detectorActions'

/**
 * Coordinates the suggestions overlay based on detector actions.
 * This is the glue between the detector logic and the UI.
 */
export function createSuggestionsCoordinator(): DetectorActions {
  return {
    onDetectionStarted(buffer: string, position?: { x: number; y: number }) {
      if (position) {
        suggestionsOverlayManager.show(buffer, position.x, position.y)
      } else {
        suggestionsOverlayManager.show(buffer)
      }
    },

    onDetectionUpdated(buffer: string, position?: { x: number; y: number }) {
      if (position) {
        suggestionsOverlayManager.show(buffer, position.x, position.y)
      } else {
        suggestionsOverlayManager.show(buffer)
      }
    },

    onDetectionCancelled() {
      suggestionsOverlayManager.hide()
    },

    onMacroCommitted(macroId: string) {
      suggestionsOverlayManager.hide()
      
      // Could dispatch analytics event here
      // analyticsService.trackMacroUsage(macroId)
    },

    onCommitRequested(buffer: string): boolean {
      // If overlay is visible, let it handle the commit
      if (suggestionsOverlayManager.isVisible()) {
        return suggestionsOverlayManager.selectCurrent()
      }
      return false
    },

    onNavigationRequested(direction: 'up' | 'down'): boolean {
      if (suggestionsOverlayManager.isVisible()) {
        return suggestionsOverlayManager.navigate(direction)
      }
      return false
    },

    onCancelRequested(): boolean {
      if (suggestionsOverlayManager.isVisible()) {
        suggestionsOverlayManager.hide()
        return true
      }
      return false
    },

    onShowAllRequested(buffer: string, position?: { x: number; y: number }): void {
      // The old suggestions coordinator doesn't support showAll functionality
      // so it just ignores this request, falling back to default behavior
      if (position) {
        suggestionsOverlayManager.show(buffer, position.x, position.y)
      } else {
        suggestionsOverlayManager.show(buffer)
      }
    },
  }
}

export type SuggestionsCoordinator = ReturnType<typeof createSuggestionsCoordinator>
