import { OptionsManager, OptionsState } from '../managers/optionsManager';
import { Lang, ColorTheme } from '../../types';

/**
 * OptionsCoordinator: Public API for the options system
 *
 * Responsibilities:
 * - Provide clean public API for options
 * - Handle lifecycle management (attach/detach, enable/disable)
 * - Wrapper around OptionsManager
 * - Integration point with the rest of the application
 */
export interface OptionsCoordinator {
  // State management
  getState(): OptionsState;
  setPrefixes(prefixes: string[]): void;
  setUseCommitKeys(enabled: boolean): void;
  setLanguage(lang: Lang): void;
  setColorTheme(colorTheme: ColorTheme): void;
  resetToDefaults(): void;

  // Subscriptions
  subscribe(callback: (state: OptionsState) => void): () => void;

  // Lifecycle
  attach(): void;
  detach(): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  destroy(): void;
}

/**
 * Default options values
 */
const DEFAULT_OPTIONS: OptionsState = {
  prefixes: ['::'],
  useCommitKeys: false,
  language: 'en',
  colorTheme: 'humo',
};

/**
 * Create an options coordinator
 */
export function createOptionsCoordinator(
  manager: OptionsManager
): OptionsCoordinator {
  let isEnabled = true;

  /**
   * Get the current options state
   */
  const getState = (): OptionsState => {
    return manager.getState();
  };

  /**
   * Set prefixes configuration
   */
  const setPrefixes = (prefixes: string[]): void => {
    if (!isEnabled) return;
    manager.setPrefixes(prefixes);
  };

  /**
   * Set useCommitKeys configuration
   */
  const setUseCommitKeys = (enabled: boolean): void => {
    if (!isEnabled) return;
    manager.setUseCommitKeys(enabled);
  };

  const setLanguage = (lang: Lang): void => {
    if (!isEnabled) return;
    manager.setLanguage(lang);
  };

  const setColorTheme = (colorTheme: ColorTheme): void => {
    if (!isEnabled) return;
    manager.setColorTheme(colorTheme);
  };

  /**
   * Reset options to default values
   */
  const resetToDefaults = (): void => {
    if (!isEnabled) return;
    manager.setState(DEFAULT_OPTIONS);
  };

  /**
   * Subscribe to options state changes
   */
  const subscribe = (callback: (state: OptionsState) => void): (() => void) => {
    return manager.subscribe(callback);
  };

  /**
   * Attach any event listeners or initialize resources
   * (Currently no-op, but provides extension point for future features)
   */
  const attach = (): void => {
    // Future: Could attach keyboard shortcuts, message listeners, etc.
  };

  /**
   * Detach event listeners and clean up
   */
  const detach = (): void => {
    // Future: Clean up any attached listeners
  };

  /**
   * Enable the options coordinator
   */
  const enable = (): void => {
    isEnabled = true;
  };

  /**
   * Disable the options coordinator
   */
  const disable = (): void => {
    isEnabled = false;
  };

  /**
   * Check if the coordinator is enabled
   */
  const isEnabledFn = (): boolean => {
    return isEnabled;
  };

  /**
   * Destroy the coordinator and clean up all resources
   */
  const destroy = (): void => {
    detach();
    manager.destroy();
  };

  const coordinator: OptionsCoordinator = {
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

  return coordinator;
}
