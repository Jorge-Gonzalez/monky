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
 * Default implementation that interacts with the store directly.
 */
export function createStorePopupActions(): PopupActions {
  const { setTheme, toggleSiteDisabled } = useMacroStore;

  return {
    onThemeChanged(theme) {
      setTheme(theme);
    },

    onSiteToggled(hostname, isEnabled) {
      toggleSiteDisabled(hostname);
    },

    onCreateNewMacroRequested() {
      // Open editor page
      chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
    },

    onError(error) {
      console.error('Popup error:', error);
      // Could dispatch to UI for user feedback
    }
  }
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