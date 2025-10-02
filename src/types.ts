export type Macro = { id: number|string; command: string; text: string; updated_at?: string; is_sensitive?: boolean }

export type ThemeMode = 'light' | 'dark' | 'system'

export type Lang = 'es' | 'en'

export type MacroConfig = {
  disabledSites: string[]
  prefixes: string[]
  useCommitKeys?: boolean
  theme: ThemeMode
  language?: Lang
}

export type CoreState = { active: boolean; buffer: string }

export type EditableEl = HTMLInputElement | HTMLTextAreaElement | HTMLElement | null
