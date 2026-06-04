// Pattern: Store-Hook — the options feature reads/writes config on the store
// directly. No manager/coordinator/actions; this hook is the whole Feature API.
import { useMacroStore } from '../store/useMacroStore';
import { Lang, ColorTheme } from '../types';

export interface OptionsApi {
  prefixes: string[];
  useCommitKeys: boolean;
  language: Lang;
  colorTheme: ColorTheme;
  setPrefixes(prefixes: string[]): void;
  setUseCommitKeys(enabled: boolean): void;
  setLanguage(language: Lang): void;
  setColorTheme(colorTheme: ColorTheme): void;
}

export function useOptions(): OptionsApi {
  const config = useMacroStore(s => s.config);
  const setPrefixes = useMacroStore(s => s.setPrefixes);
  const setUseCommitKeys = useMacroStore(s => s.setUseCommitKeys);
  const setLanguage = useMacroStore(s => s.setLanguage);
  const setColorTheme = useMacroStore(s => s.setColorTheme);

  return {
    prefixes: config.prefixes ?? [],
    useCommitKeys: config.useCommitKeys ?? false,
    language: config.language ?? 'en',
    colorTheme: config.colorTheme ?? 'humo',
    setPrefixes,
    setUseCommitKeys,
    setLanguage,
    setColorTheme,
  };
}
