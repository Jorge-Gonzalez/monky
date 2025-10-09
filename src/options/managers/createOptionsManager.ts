import { OptionsActions } from '../actions/optionsActions';
import { useMacroStore } from '../../store/useMacroStore';

export interface OptionsState {
  prefixes: string[];
  useCommitKeys: boolean;
}

export interface OptionsManager {
  setPrefixes(prefixes: string[]): void;
  setUseCommitKeys(useCommitKeys: boolean): void;
  getState(): OptionsState;
  subscribe(callback: (state: OptionsState) => void): () => void;
}

export function createOptionsManager(actions: OptionsActions): OptionsManager {
  let subscribers: Array<(state: OptionsState) => void> = [];

  const notifySubscribers = () => {
    const state = getState();
    subscribers.forEach(callback => callback({ ...state }));
  };

  const getState = (): OptionsState => {
    const storeState = useMacroStore.getState();
    return {
      prefixes: storeState.config.prefixes || [],
      useCommitKeys: storeState.config.useCommitKeys || false,
    };
  };

  const unsubscribeStore = useMacroStore.subscribe(notifySubscribers);

  const manager: OptionsManager = {
    setPrefixes(prefixes) {
      actions.onPrefixesChanged(prefixes);
    },
    setUseCommitKeys(useCommitKeys) {
      actions.onUseCommitKeysChanged(useCommitKeys);
    },
    getState,
    subscribe(callback) {
      subscribers.push(callback);
      return () => {
        subscribers = subscribers.filter(sub => sub !== callback);
      };
    },
  };

  (manager as any).destroy = () => {
    if (unsubscribeStore) unsubscribeStore();
  };

  return manager;
}