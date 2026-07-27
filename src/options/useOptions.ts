// Pattern: Store-Hook — the options feature reads/writes config on the store
// directly. No manager/coordinator/actions; this hook is the whole Feature API.
import { useMacroStore } from '../store/useMacroStore'
import type { Lang, ColorTheme, ThemeMode } from '../types'

export interface OptionsApi {
  prefixes: string[]
  useCommitKeys: boolean
  language: Lang
  colorTheme: ColorTheme
  theme: ThemeMode
  // Declared as function-typed properties rather than method shorthand: these are plain
  // store functions meant to be destructured and passed around, not methods bound to an
  // OptionsApi instance. Method shorthand would claim they may depend on `this`.
  setPrefixes: (prefixes: string[]) => void
  setUseCommitKeys: (enabled: boolean) => void
  setLanguage: (language: Lang) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  setTheme: (theme: ThemeMode) => void
}

export function useOptions(): OptionsApi {
  const config = useMacroStore(s => s.config)
  const setPrefixes = useMacroStore(s => s.setPrefixes)
  const setUseCommitKeys = useMacroStore(s => s.setUseCommitKeys)
  const setLanguage = useMacroStore(s => s.setLanguage)
  const setColorTheme = useMacroStore(s => s.setColorTheme)
  const setTheme = useMacroStore(s => s.setTheme)

  return {
    prefixes: config.prefixes,
    useCommitKeys: config.useCommitKeys,
    language: config.language,
    colorTheme: config.colorTheme,
    theme: config.theme,
    setPrefixes,
    setUseCommitKeys,
    setLanguage,
    setColorTheme,
    setTheme,
  }
}
