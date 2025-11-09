import { PopupActions } from './popupActions';
import { useMacroStore } from '../../store/useMacroStore';
import { getErrorMessage } from '../../lib/errors';

/**
 * Creates default popup actions that interact with the global store.
 */
export function createDefaultPopupActions(): PopupActions {
  return {
    onThemeChanged(theme) {
      useMacroStore.getState().setTheme(theme);
    },

    onSiteToggled(hostname, isEnabled) {
      useMacroStore.getState().toggleSiteDisabled(hostname);
    },

    async onCreateNewMacroRequested() {
      // Send message to content script to open the editor modal
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'open-editor' });
      }
    },

    onError(error) {
      console.error('Popup error:', error);
      // Could dispatch to UI for user feedback
    }
  }
}