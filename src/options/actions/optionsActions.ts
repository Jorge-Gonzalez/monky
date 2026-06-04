import { Lang, ColorTheme } from '../../types';

/**
 * Interface defining actions that the options system can trigger.
 * This creates a clear contract between the options coordinator and its handlers,
 * and serves as the single seam where option changes are persisted.
 */
export interface OptionsActions {
  /**
   * Called when the macro prefixes change.
   */
  onPrefixesChanged(prefixes: string[]): void

  /**
   * Called when the commit-keys (manual replacement) setting changes.
   */
  onUseCommitKeysChanged(enabled: boolean): void

  /**
   * Called when the language changes.
   */
  onLanguageChanged(language: Lang): void

  /**
   * Called when the color theme changes.
   */
  onColorThemeChanged(colorTheme: ColorTheme): void
}

/**
 * No-op implementation for testing or when no actions are needed.
 */
export const noOpOptionsActions: OptionsActions = {
  onPrefixesChanged: () => {},
  onUseCommitKeysChanged: () => {},
  onLanguageChanged: () => {},
  onColorThemeChanged: () => {},
}
