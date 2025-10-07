/**
 * Interface defining actions that the macro detector can trigger.
 * This creates a clear contract between the detector and its handlers.
 */
export interface DetectorActions {
  /**
   * Called when macro detection starts (first prefix character typed).
   */
  onDetectionStarted(buffer: string, position?: { x: number; y: number }): void

  /**
   * Called when the detection buffer changes.
   */
  onDetectionUpdated(buffer: string, position?: { x: number; y: number }): void

  /**
   * Called when detection is cancelled (invalid key, blur, etc).
   */
  onDetectionCancelled(): void

  /**
   * Called when a macro has been successfully committed.
   */
  onMacroCommitted(macroId: string): void

  /**
   * Called when user presses a commit key (space, enter, tab).
   * @returns true if the action was handled, false otherwise
   */
  onCommitRequested(buffer: string): boolean

  /**
   * Called when user presses arrow keys during detection.
   * @returns true if the action was handled, false otherwise
   */
  onNavigationRequested(direction: 'up' | 'down'): boolean

  /**
   * Called when user presses Escape during detection.
   * @returns true if the action was handled, false otherwise
   */
  onCancelRequested(): boolean
}

/**
 * No-op implementation for testing or when no actions are needed.
 */
export const noOpActions: DetectorActions = {
  onDetectionStarted: () => {},
  onDetectionUpdated: () => {},
  onDetectionCancelled: () => {},
  onMacroCommitted: () => {},
  onCommitRequested: () => false,
  onNavigationRequested: () => false,
  onCancelRequested: () => false,
}
