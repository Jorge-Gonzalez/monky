// Pattern: Store-Hook — the options feature reads/writes config on the store
// directly. No manager/coordinator/actions; this hook is the whole Feature API.
import { useMacroStore } from '../store/useMacroStore';
import { Lang, ColorTheme } from '../types';

export interface OptionsApi {
  prefixes: string[];
  useCommitKeys: boolean;
  language: Lang;
  colorTheme: ColorTheme;
  setUseCommitKeys(enabled: boolean): void;
  setLanguage(language: Lang): void;
  setColorTheme(colorTheme: ColorTheme): void;
  /** Toggle a prefix on/off. Returns false (no change) if it would remove the last one. */
  togglePrefix(prefix: string): boolean;
}

export function useOptions(): OptionsApi {
  const config = useMacroStore(s => s.config);
  const setPrefixes = useMacroStore(s => s.setPrefixes);
  const setUseCommitKeys = useMacroStore(s => s.setUseCommitKeys);
  const setLanguage = useMacroStore(s => s.setLanguage);
  const setColorTheme = useMacroStore(s => s.setColorTheme);

  const prefixes = config.prefixes ?? [];

  const togglePrefix = (prefix: string): boolean => {
    const isSelected = prefixes.includes(prefix);
    if (isSelected && prefixes.length === 1) return false; // keep at least one prefix
    setPrefixes(isSelected ? prefixes.filter(p => p !== prefix) : [...prefixes, prefix]);
    return true;
  };

  return {
    prefixes,
    useCommitKeys: config.useCommitKeys ?? false,
    language: config.language ?? 'en',
    colorTheme: config.colorTheme ?? 'humo',
    setUseCommitKeys,
    setLanguage,
    setColorTheme,
    togglePrefix,
  };
}
