import { OptionsManager, OptionsState, DEFAULT_OPTIONS } from '../managers/optionsManager';
import { useMacroStore } from '../../store/useMacroStore';
import { Lang, ColorTheme } from '../../types';

/**
 * OptionsCoordinator: bridges the in-memory OptionsManager with the persistent
 * Zustand store.
 *
 * Responsibilities:
 * - Seed the manager from the store and keep it in sync with external changes
 *   (popup, another device).
 * - Persist user changes to the store — writing only the field that changed, so
 *   a single edit is a single storage write (not a full-config rewrite).
 * - Provide the public API and lifecycle management for the options system.
 */
export interface OptionsCoordinator {
  getState(): OptionsState;
  setPrefixes(prefixes: string[]): void;
  setUseCommitKeys(enabled: boolean): void;
  setLanguage(lang: Lang): void;
  setColorTheme(colorTheme: ColorTheme): void;
  resetToDefaults(): void;

  subscribe(callback: (state: OptionsState) => void): () => void;

  attach(): void;
  detach(): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  destroy(): void;
}

function readOptionsFromStore(): OptionsState {
  const { config } = useMacroStore.getState();
  return {
    prefixes: config.prefixes ?? DEFAULT_OPTIONS.prefixes,
    useCommitKeys: config.useCommitKeys ?? DEFAULT_OPTIONS.useCommitKeys,
    language: config.language ?? DEFAULT_OPTIONS.language,
    colorTheme: config.colorTheme ?? DEFAULT_OPTIONS.colorTheme,
  };
}

export function createOptionsCoordinator(manager: OptionsManager): OptionsCoordinator {
  let isEnabled = true;
  // Guards the synchronous store-subscription echo of our own writes, so a local
  // edit doesn't bounce back into the manager. (The async storage.onChanged echo
  // is handled separately by the store's own last-write guard.)
  let isWritingLocally = false;

  // Seed the manager with the persisted state, then keep it synced with external
  // store changes (cross-context edits, late hydration, cross-device sync).
  manager.setState(readOptionsFromStore());
  const unsubscribeStore = useMacroStore.subscribe(() => {
    if (isWritingLocally) return;
    manager.setState(readOptionsFromStore());
  });

  // Apply a change locally (optimistic UI via the manager) and persist just the
  // changed field to the store.
  const apply = (
    update: Partial<OptionsState>,
    persist: (store: ReturnType<typeof useMacroStore.getState>) => void,
  ): void => {
    if (!isEnabled) return;
    manager.setState(update);
    isWritingLocally = true;
    try {
      persist(useMacroStore.getState());
    } finally {
      isWritingLocally = false;
    }
  };

  const getState = (): OptionsState => manager.getState();

  const setPrefixes = (prefixes: string[]): void =>
    apply({ prefixes }, store => store.setPrefixes(prefixes));

  const setUseCommitKeys = (enabled: boolean): void =>
    apply({ useCommitKeys: enabled }, store => store.setUseCommitKeys(enabled));

  const setLanguage = (language: Lang): void =>
    apply({ language }, store => store.setLanguage(language));

  const setColorTheme = (colorTheme: ColorTheme): void =>
    apply({ colorTheme }, store => store.setColorTheme(colorTheme));

  const resetToDefaults = (): void => {
    setPrefixes(DEFAULT_OPTIONS.prefixes);
    setUseCommitKeys(DEFAULT_OPTIONS.useCommitKeys);
    setLanguage(DEFAULT_OPTIONS.language);
    setColorTheme(DEFAULT_OPTIONS.colorTheme);
  };

  const subscribe = (callback: (state: OptionsState) => void): (() => void) =>
    manager.subscribe(callback);

  const attach = (): void => {};
  const detach = (): void => {};
  const enable = (): void => { isEnabled = true; };
  const disable = (): void => { isEnabled = false; };
  const isEnabledFn = (): boolean => isEnabled;

  const destroy = (): void => {
    unsubscribeStore();
    manager.destroy();
  };

  return {
    getState,
    setPrefixes,
    setUseCommitKeys,
    setLanguage,
    setColorTheme,
    resetToDefaults,
    subscribe,
    attach,
    detach,
    enable,
    disable,
    isEnabled: isEnabledFn,
    destroy,
  };
}
