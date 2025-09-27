import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { defaultMacroConfig } from '../config/defaults'
import { dummyMacros } from '../config/defaults'

export type Macro = { id: number|string; command: string; text: string; updated_at?: string; is_sensitive?: boolean }
export type ThemeMode = 'light' | 'dark' | 'system'
export type MacroConfig = {
  disabledSites: string[]
  prefixes: string[]
  useCommitKeys?: boolean
  theme: ThemeMode
  language?: Lang
}
type StoreOpResult = { success: boolean; error?: string }

type Lang = 'es' | 'en'

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
  setLanguage: (language: Lang) => void
}

// --- Standalone helper function ---
function commandExists(macros: Macro[], command: string, currentId?: Macro['id']): boolean {
  return macros.some(m => m.command === command && String(m.id) !== String(currentId))
}

// Custom storage object for Chrome extension storage.
const chromeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(name)
    return result[name] ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [name]: value })
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.local.remove(name)
  },
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
        language: defaultMacroConfig.language,
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
      setLanguage: (language: Lang) =>
        set(s => ({ config: { ...s.config, language } })),
      toggleSiteDisabled: (hostname: string) =>
        set((s) => {
          const disabledSites = s.config.disabledSites || []
          const isCurrentlyDisabled = disabledSites.includes(hostname)
          const newDisabledSites = isCurrentlyDisabled
            ? disabledSites.filter((site) => site !== hostname) // Remove from disabled list
            : [...disabledSites, hostname] // Add to disabled list

          return {
            config: {
              ...s.config,
              disabledSites: newDisabledSites,
            },
          }
        }),
    }),
    {
      name: 'macro-storage',
      storage: createJSONStorage(() => chromeStorage),
      /**
       * A custom merge function to perform a deep merge on the `config` object.
       * This ensures that new default values in `defaultMacroConfig` are not
       * overwritten by an older persisted state that might not have them.
       * @param persistedState The state loaded from storage.
       * @param currentState The current (initial) state.
       * @returns The merged state.
       */
      merge: (persistedState: MacroStore, currentState) => ({
        ...currentState,
        ...persistedState,
        config: {
          ...currentState.config,
          ...(persistedState as MacroStore).config,
        },
      }),
    }
  )
)

/**
 * This listener will automatically rehydrate the store in the current context
 * (e.g., the content script) whenever the data in chrome.storage.local changes
 * due to an action in another context (e.g., the popup).
 */
chrome.storage.onChanged.addListener((changes, area) => {
  // Check if the change happened in 'local' storage and if our store's data was the one that changed.
  if (area === 'local') {
    const storeName = useMacroStore.persist.getOptions().name;
    if (storeName && changes[storeName]) {
      useMacroStore.persist.rehydrate();
    }
  }
});
