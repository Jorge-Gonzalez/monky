import { MacroConfig } from '../../store/useMacroStore';

export interface OptionsActions {
  onPrefixesChanged(prefixes: string[]): void;
  onUseCommitKeysChanged(useCommitKeys: boolean): void;
  onSettingsChanged(settings: Partial<MacroConfig>): void;
}