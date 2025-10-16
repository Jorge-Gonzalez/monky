export type Macro = {
  id: number | string
  command: string
  text: string
  updated_at?: string
  is_sensitive?: boolean
  html?: string
  contentType?: 'text/plain' | 'text/html'
  isSystemMacro?: boolean
  description?: string
}

export type ThemeMode = 'light' | 'dark' | 'system'

export type Lang = 'es' | 'en'

// Used to define the placement of the suggestions poupup
export type verticalPlacement = 'top' | 'bottom'

export type Config = {
  disabledSites: string[]
  prefixes: string[]
  useCommitKeys?: boolean
  theme: ThemeMode
  language?: Lang
  suggestionsPopupPlacement?: verticalPlacement
}

export type CoreState = { active: boolean; buffer: string }

export type EditableEl = HTMLInputElement | HTMLTextAreaElement | HTMLElement | null
