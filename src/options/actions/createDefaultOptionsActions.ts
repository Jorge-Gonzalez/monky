import { OptionsActions } from './optionsActions';
import { useMacroStore } from '../../store/useMacroStore';

/**
 * Creates default options actions that persist changes to the global store.
 * Each action is a thin, single-responsibility dispatch — one option, one
 * store write.
 */
export function createDefaultOptionsActions(): OptionsActions {
  return {
    onPrefixesChanged(prefixes) {
      useMacroStore.getState().setPrefixes(prefixes);
    },

    onUseCommitKeysChanged(enabled) {
      useMacroStore.getState().setUseCommitKeys(enabled);
    },

    onLanguageChanged(language) {
      useMacroStore.getState().setLanguage(language);
    },

    onColorThemeChanged(colorTheme) {
      useMacroStore.getState().setColorTheme(colorTheme);
    },
  };
}
