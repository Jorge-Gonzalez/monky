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

    onCreateNewMacroRequested() {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
    },

    onError(error) {
      console.error('Popup error:', error);
      // Could dispatch to UI for user feedback
    }
  }
}