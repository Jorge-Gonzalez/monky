import { DetectorActions } from '../actions/detectorActions'

/**
 * Example: Analytics/logging handler.
 * This can run alongside the suggestions coordinator.
 */
export function createAnalyticsActions(): DetectorActions {
  return {
    onDetectionStarted(buffer) {
      console.log('[Analytics] Detection started:', buffer)
    },

    onDetectionUpdated(buffer) {
      console.log('[Analytics] Detection updated:', buffer)
    },

    onDetectionCancelled() {
      console.log('[Analytics] Detection cancelled')
    },

    onMacroCommitted(macroId) {
      console.log('[Analytics] Macro committed:', macroId)
      // Could send to analytics service
      // analyticsService.track('macro_used', { macroId })
    },

    onCommitRequested(buffer): boolean {
      console.log('[Analytics] Commit requested:', buffer)
      return false // Don't handle, just log
    },

    onNavigationRequested(direction): boolean {
      console.log('[Analytics] Navigation requested:', direction)
      return false
    },

    onCancelRequested(): boolean {
      console.log('[Analytics] Cancel requested')
      return false
    },
  }
}
