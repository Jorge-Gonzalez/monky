import { useMacroStore, MacroConfig } from '../../store/useMacroStore';
import { OptionsActions } from './optionsActions';

export function createDefaultOptionsActions(): OptionsActions {
  const store = useMacroStore.getState();

  return {
    onPrefixesChanged(prefixes) {
      store.setPrefixes(prefixes);
    },
    onUseCommitKeysChanged(useCommitKeys) {
      store.setUseCommitKeys(useCommitKeys);
    },
    onSettingsChanged(settings: Partial<MacroConfig>) {
      store.setConfig(settings);
    },
  };
}