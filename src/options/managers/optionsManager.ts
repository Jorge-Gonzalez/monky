import { useMacroStore } from '../../store/useMacroStore';

export interface OptionsState {
  prefixes: string[];
  useCommitKeys: boolean;
}

export interface OptionsManager {
  getState(): OptionsState;
  setState(state: Partial<OptionsState>): void;
  setPrefixes(prefixes: string[]): void;
  setUseCommitKeys(useCommitKeys: boolean): void;
  validate(state: Partial<OptionsState>): boolean;
  syncToStore(): void;
  syncFromStore(): void;
  subscribe(callback: (state: OptionsState) => void): () => void;
  destroy(): void;
}

/**
 * OptionsManager: Core state management logic for extension options
 *
 * Responsibilities:
 * - Manage options state internally
 * - Validate option values
 * - Sync with macro store
 * - Notify subscribers of state changes
 */
export function createOptionsManager(): OptionsManager {
  let subscribers: Array<(state: OptionsState) => void> = [];
  let currentState: OptionsState = getStateFromStore();
  let isUpdating = false; // Flag to prevent subscription feedback loop

  /**
   * Get current state from the macro store
   */
  function getStateFromStore(): OptionsState {
    const storeState = useMacroStore.getState();
    return {
      prefixes: storeState.config.prefixes || [],
      useCommitKeys: storeState.config.useCommitKeys || false,
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  const notifySubscribers = () => {
    subscribers.forEach(callback => callback({ ...currentState }));
  };

  /**
   * Subscribe to macro store changes to keep in sync
   */
  const unsubscribeStore = useMacroStore.subscribe(() => {
    // Ignore store changes that we triggered ourselves
    if (isUpdating) {
      return;
    }

    currentState = getStateFromStore();
    notifySubscribers();
  });

  /**
   * Get the current options state
   */
  const getState = (): OptionsState => {
    return { ...currentState };
  };

  /**
   * Update the state with partial values
   */
  const setState = (newState: Partial<OptionsState>): void => {
    if (!validate(newState)) {
      console.warn('Invalid options state:', newState);
      return;
    }

    currentState = {
      ...currentState,
      ...newState,
    };

    syncToStore();
    notifySubscribers();
  };

  /**
   * Set prefixes configuration
   */
  const setPrefixes = (prefixes: string[]): void => {
    setState({ prefixes });
  };

  /**
   * Set useCommitKeys configuration
   */
  const setUseCommitKeys = (useCommitKeys: boolean): void => {
    setState({ useCommitKeys });
  };

  /**
   * Validate options state
   */
  const validate = (state: Partial<OptionsState>): boolean => {
    if (state.prefixes !== undefined) {
      // Ensure prefixes is an array
      if (!Array.isArray(state.prefixes)) {
        return false;
      }
      // Ensure all prefixes are non-empty strings
      if (state.prefixes.some(p => typeof p !== 'string' || p.trim() === '')) {
        return false;
      }
    }

    if (state.useCommitKeys !== undefined) {
      // Ensure useCommitKeys is a boolean
      if (typeof state.useCommitKeys !== 'boolean') {
        return false;
      }
    }

    return true;
  };

  /**
   * Sync current state to the macro store
   */
  const syncToStore = (): void => {
    // Set flag to prevent subscription feedback loop
    isUpdating = true;

    try {
      const store = useMacroStore.getState();
      // Call individual setters instead of setConfig
      store.setPrefixes(currentState.prefixes);
      store.setUseCommitKeys(currentState.useCommitKeys);
    } finally {
      // Always clear the flag, even if there's an error
      isUpdating = false;
    }
  };

  /**
   * Sync state from the macro store (useful after external changes)
   */
  const syncFromStore = (): void => {
    currentState = getStateFromStore();
    notifySubscribers();
  };

  /**
   * Subscribe to state changes
   */
  const subscribe = (callback: (state: OptionsState) => void): (() => void) => {
    subscribers.push(callback);
    // Immediately call with current state
    callback(getState());

    // Return unsubscribe function
    return () => {
      subscribers = subscribers.filter(sub => sub !== callback);
    };
  };

  /**
   * Clean up resources
   */
  const destroy = (): void => {
    if (unsubscribeStore) {
      unsubscribeStore();
    }
    subscribers = [];
  };

  const manager: OptionsManager = {
    getState,
    setState,
    setPrefixes,
    setUseCommitKeys,
    validate,
    syncToStore,
    syncFromStore,
    subscribe,
    destroy,
  };

  return manager;
}
