/**
 * Interface defining actions that the popup can trigger.
 * This creates a clear contract between the popup and its handlers.
 */
export interface PopupActions {
  /**
   * Called when theme is changed.
   */
  onThemeChanged(theme: 'light' | 'dark' | 'system'): void

  /**
   * Called when site is toggled (enabled/disabled).
   */
  onSiteToggled(hostname: string, isEnabled: boolean): void

  /**
   * Called when user wants to create a new macro.
   */
  onCreateNewMacroRequested(): void

  /**
   * Called when there's an error in the popup.
   */
  onError(error: string): void
}

/**
 * No-op implementation for testing or when no actions are needed.
 */
export const noOpPopupActions: PopupActions = {
  onThemeChanged: () => {},
  onSiteToggled: () => {},
  onCreateNewMacroRequested: () => {},
  onError: () => {},
}