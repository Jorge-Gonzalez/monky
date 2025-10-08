import { PopupActions } from '../actions/popupActions';
import { useMacroStore } from '../../store/useMacroStore';
import { Macro } from '../../types';

interface PopupState {
  theme: 'light' | 'dark' | 'system';
  disabledSites: string[];
  hostname: string | null;
  pending: number;
  macros: Macro[];
}

export interface PopupManager {
  // Theme management
  setTheme(theme: 'light' | 'dark' | 'system'): void;
  getTheme(): 'light' | 'dark' | 'system';
  
  // Site enable/disable
  toggleSite(hostname: string): void;
  isSiteEnabled(hostname: string): boolean;
  
  // New macro flow
  requestNewMacro(): void;
  
  // State retrieval
  getState(): PopupState;
  
  // Subscription
  subscribe(callback: (state: PopupState) => void): () => void;
}

export function createPopupManager(actions: PopupActions): PopupManager {
  let subscribers: Array<(state: PopupState) => void> = [];
  let currentHostname: string | null = null;
  
  // Initialize hostname
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.url) {
      const validProtocols = ['http:', 'https:', 'file:'];
      try {
        const url = new URL(tabs[0].url);
        if (validProtocols.includes(url.protocol)) {
          currentHostname = url.hostname;
          notifySubscribers();
        }
      } catch (e) {
        // Not a valid URL, do nothing
      }
    }
  });

  const notifySubscribers = () => {
    const state = getState();
    subscribers.forEach(callback => callback(state));
  };

  const getState = (): PopupState => {
    const storeState = useMacroStore.getState();
    return {
      theme: storeState.config.theme ?? 'system',
      disabledSites: storeState.config.disabledSites || [],
      hostname: currentHostname,
      pending: 0, // This would come from the popup hook
      macros: storeState.macros,
    };
  };

  // Subscribe to store changes to notify subscribers
  const unsubscribeStore = useMacroStore.subscribe(() => {
    notifySubscribers();
  });

  const manager: PopupManager = {
    setTheme(theme) {
      actions.onThemeChanged(theme);
    },

    getTheme() {
      return useMacroStore.getState().config.theme ?? 'system';
    },

    toggleSite(hostname) {
      const state = useMacroStore.getState();
      const isEnabled = !state.config.disabledSites?.includes(hostname);
      actions.onSiteToggled(hostname, !isEnabled);
    },

    isSiteEnabled(hostname) {
      const state = useMacroStore.getState();
      return !state.config.disabledSites?.includes(hostname);
    },

    requestNewMacro() {
      actions.onCreateNewMacroRequested();
    },

    getState,

    subscribe(callback) {
      subscribers.push(callback);
      
      // Return unsubscribe function
      return () => {
        subscribers = subscribers.filter(sub => sub !== callback);
      };
    }
  };

  // Cleanup function for when manager is no longer needed
  (manager as any).destroy = () => {
    if (unsubscribeStore) unsubscribeStore();
  };

  return manager;
}