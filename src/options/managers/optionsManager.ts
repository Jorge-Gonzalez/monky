import { Lang, ColorTheme } from '../../types';

export interface OptionsState {
  prefixes: string[];
  useCommitKeys: boolean;
  language: Lang;
  colorTheme: ColorTheme;
}

export interface OptionsManager {
  getState(): OptionsState;
  setState(state: Partial<OptionsState>): void;
  setPrefixes(prefixes: string[]): void;
  setUseCommitKeys(useCommitKeys: boolean): void;
  setLanguage(lang: Lang): void;
  setColorTheme(colorTheme: ColorTheme): void;
  validate(state: Partial<OptionsState>): boolean;
  subscribe(callback: (state: OptionsState) => void): () => void;
  destroy(): void;
}

export const DEFAULT_OPTIONS: OptionsState = {
  prefixes: ['::'],
  useCommitKeys: false,
  language: 'en',
  colorTheme: 'humo',
};

/**
 * OptionsManager: in-memory state model for extension options.
 *
 * Responsibilities:
 * - Own the options state
 * - Validate option values
 * - Notify subscribers of state changes
 *
 * It is intentionally store-agnostic: persistence and cross-context sync are
 * the coordinator's job. This keeps the manager a pure, easily-testable unit.
 */
export function createOptionsManager(
  initialState: OptionsState = DEFAULT_OPTIONS
): OptionsManager {
  let subscribers: Array<(state: OptionsState) => void> = [];
  let currentState: OptionsState = { ...initialState };

  const notifySubscribers = (): void => {
    subscribers.forEach(callback => callback({ ...currentState }));
  };

  const getState = (): OptionsState => ({ ...currentState });

  const setState = (newState: Partial<OptionsState>): void => {
    if (!validate(newState)) {
      console.warn('Invalid options state:', newState);
      return;
    }
    currentState = { ...currentState, ...newState };
    notifySubscribers();
  };

  const setPrefixes = (prefixes: string[]): void => setState({ prefixes });
  const setUseCommitKeys = (useCommitKeys: boolean): void => setState({ useCommitKeys });
  const setLanguage = (language: Lang): void => setState({ language });
  const setColorTheme = (colorTheme: ColorTheme): void => setState({ colorTheme });

  const validate = (state: Partial<OptionsState>): boolean => {
    if (state.prefixes !== undefined) {
      if (!Array.isArray(state.prefixes)) return false;
      if (state.prefixes.some(p => typeof p !== 'string' || p.trim() === '')) return false;
    }
    if (state.useCommitKeys !== undefined && typeof state.useCommitKeys !== 'boolean') {
      return false;
    }
    return true;
  };

  const subscribe = (callback: (state: OptionsState) => void): (() => void) => {
    subscribers.push(callback);
    callback(getState());
    return () => {
      subscribers = subscribers.filter(sub => sub !== callback);
    };
  };

  const destroy = (): void => {
    subscribers = [];
  };

  return {
    getState,
    setState,
    setPrefixes,
    setUseCommitKeys,
    setLanguage,
    setColorTheme,
    validate,
    subscribe,
    destroy,
  };
}
