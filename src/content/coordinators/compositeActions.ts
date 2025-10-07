import { DetectorActions } from '../actions/detectorActions'

/**
 * Combines multiple action handlers into one.
 * Useful for having multiple systems respond to detector events.
 */
export function createCompositeActions(...handlers: DetectorActions[]): DetectorActions {
  return {
    onDetectionStarted(buffer, position) {
      handlers.forEach(h => h.onDetectionStarted(buffer, position))
    },

    onDetectionUpdated(buffer, position) {
      handlers.forEach(h => h.onDetectionUpdated(buffer, position))
    },

    onDetectionCancelled() {
      handlers.forEach(h => h.onDetectionCancelled())
    },

    onMacroCommitted(macroId) {
      handlers.forEach(h => h.onMacroCommitted(macroId))
    },

    onCommitRequested(buffer): boolean {
      // Return true if ANY handler handled it
      return handlers.some(h => h.onCommitRequested(buffer))
    },

    onNavigationRequested(direction): boolean {
      return handlers.some(h => h.onNavigationRequested(direction))
    },

    onCancelRequested(): boolean {
      return handlers.some(h => h.onCancelRequested())
    },
  }
}

