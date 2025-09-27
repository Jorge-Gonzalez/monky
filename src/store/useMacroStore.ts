import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultMacroConfig } from '../config/defaults'
import { dummyMacros } from '../config/defaults'

export type Macro = { id: number|string; command: string; text: string; updated_at?: string; is_sensitive?: boolean }
export type ThemeMode = 'light' | 'dark' | 'system'
export type MacroConfig = {
  disabledSites: string[]
  prefixes: string[]
  useCommitKeys?: boolean
  theme: ThemeMode
}
type StoreOpResult = { success: boolean; error?: string }

type MacroStore = {
  macros: Macro[]
  config: MacroConfig
  user: any
  syncStatus: 'idle'|'syncing'|'error'
  setUser: (u:any)=>void
  setMacros: (m:Macro[])=>void
  addMacro: (m:Macro) => StoreOpResult
  updateMacro: (id:Macro['id'], patch:Partial<Macro>) => StoreOpResult
  deleteMacro: (id:Macro['id'])=>void
  setPrefixes: (prefixes: string[])=>void
  setUseCommitKeys: (useCommitKeys: boolean) => void
  toggleSiteDisabled: (hostname: string) => void
  setTheme: (theme: ThemeMode) => void
}

// --- Standalone helper function ---
function commandExists(macros: Macro[], command: string, currentId?: Macro['id']): boolean {
  return macros.some(m => m.command === command && String(m.id) !== String(currentId))
}

export const useMacroStore = create<MacroStore>()(
  persist(
    (set, get) => ({
      macros: dummyMacros,
      user: null,
      syncStatus: 'idle',
      config: {
        disabledSites: defaultMacroConfig.disabledSites,
        prefixes: defaultMacroConfig.prefixes,
        theme: defaultMacroConfig.theme,
        useCommitKeys: defaultMacroConfig.useCommitKeys,
      },

      // --- Actions ---
      setUser: (user)=> set({ user }),
      setMacros: (macros)=> set({ macros }),
      addMacro: (macro) => {
        if (commandExists(get().macros, macro.command)) {
          const error = `El comando "${macro.command}" ya existe.`
          return { success: false, error }
        }
        set(s => ({ macros: [...s.macros, macro] }))
        return { success: true }
      },
      updateMacro: (id, patch) => {
        if (patch.command && commandExists(get().macros, patch.command, id)) {
          const error = `El comando "${patch.command}" ya existe.`
          return { success: false, error }
        }
        set(s => ({ macros: s.macros.map(m => (String(m.id) === String(id) ? { ...m, ...patch } : m)) }))
        return { success: true }
      },
      deleteMacro: (id)=> set((s)=> ({ macros: s.macros.filter(m=> String(m.id)!==String(id)) })),
      setPrefixes: (prefixes) =>
        set(s => ({ config: { ...s.config, prefixes } })),
      setUseCommitKeys: (useCommitKeys) =>
        set(s => ({ config: { ...s.config, useCommitKeys } })),
      setTheme: (theme: ThemeMode) =>
        set(s => ({ config: { ...s.config, theme } })),
      toggleSiteDisabled: (hostname: string) =>
        set((state) => {
          const disabledSites = state.config.disabledSites || []
          const isCurrentlyDisabled = disabledSites.includes(hostname)
          const newDisabledSites = isCurrentlyDisabled
            ? [...disabledSites, hostname] // Add to disabled list
            : disabledSites.filter((site) => site !== hostname) // Remove from disabled list

          return {
            config: {
              ...state.config,
              disabledSites: newDisabledSites,
            },
          }
        }),
    }),
    { name: 'macro-storage' }
  )
)
