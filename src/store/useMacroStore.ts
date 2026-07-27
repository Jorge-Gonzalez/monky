import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { defaultMacroConfig } from '../config/defaults'
import { dummyMacros } from '../config/defaults'
import type { Macro, ThemeMode, Lang, Config, verticalPlacement, ColorTheme } from '../types'

type StoreOpResult = { success: boolean; error?: string }

type MacroStore = {
  macros: Macro[]
  config: Config
  /** Reserved for the hosted backend; no shape decided yet, and nothing reads it. */
  user: unknown
  syncStatus: 'idle'|'syncing'|'error'
  setUser: (u: unknown)=>void
  setMacros: (m:Macro[])=>void
  addMacro: (m:Macro) => StoreOpResult
  updateMacro: (id:Macro['id'], patch:Partial<Macro>) => StoreOpResult
  deleteMacro: (id:Macro['id'])=>void
  setPrefixes: (prefixes: string[])=>void
  setUseCommitKeys: (useCommitKeys: boolean) => void
  toggleSiteDisabled: (hostname: string) => void
  setTheme: (theme: ThemeMode) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  setLanguage: (language: Lang) => void
}

// --- Standalone helper function ---
function commandExists(macros: Macro[], command: string, currentId?: Macro['id']): boolean {
  return macros.some(m => m.command === command && String(m.id) !== String(currentId))
}

// The serialized value this context most recently wrote. Used to ignore the
// storage.onChanged echo of our own writes (see the onChanged listener below),
// which would otherwise re-read storage and re-notify subscribers needlessly.
let lastWrittenValue: string | null = null

// Tiered storage: writes go to local (reliable) and sync (best-effort cross-device).
// Reads prefer sync so cross-device changes are picked up; local is the fallback.
const chromeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const result = await chrome.storage.sync.get(name)
      const synced = result[name] as string | undefined
      if (synced != null) return synced
    } catch { /* sync storage unavailable or over quota: fall back to local */ }
    const local = await chrome.storage.local.get(name)
    return (local[name] as string | undefined) ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    lastWrittenValue = value
    await chrome.storage.local.set({ [name]: value })
    try {
      await chrome.storage.sync.set({ [name]: value })
    } catch { /* sync storage unavailable or over quota: the local write above stands */ }
  },
  removeItem: async (name: string): Promise<void> => {
    await Promise.allSettled([
      chrome.storage.sync.remove(name),
      chrome.storage.local.remove(name),
    ])
  },
}

export const useMacroStore = create<MacroStore>()(
  persist(
    (set, get) => ({
      macros: dummyMacros,
      user: null,
      syncStatus: 'idle',
      // Seed the full defaults so config is always complete (the persist merge
      // backfills any field missing from older persisted state).
      config: { ...defaultMacroConfig },

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
      setColorTheme: (colorTheme: ColorTheme) =>
        set(s => ({ config: { ...s.config, colorTheme } })),
      setLanguage: (language: Lang) =>
        set(s => ({ config: { ...s.config, language } })),
      setSuggestionsPlacement: (placement: verticalPlacement) =>
        set(s => ({ config: { ...s.config, suggestionsPopupPlacement: placement } })),
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
      merge: (persistedState: unknown, currentState) => ({
        ...currentState,
        ...(persistedState as MacroStore),
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
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    // Rehydrate when either local (same-device context switch) or sync (cross-device) changes.
    if (area === 'local' || area === 'sync') {
      const storeName = useMacroStore.persist.getOptions().name
      const change = storeName ? changes[storeName] : undefined
      // Ignore the echo of our own writes: a change whose value matches what we
      // just persisted carries no new information, and re-reading it here (sync
      // is read first and can be stale under rate-limiting) is what caused the
      // settings controls to flicker back to a stale value. Genuine external
      // changes (popup, another device) carry a different value and still rehydrate.
      if (change && change.newValue !== lastWrittenValue) {
        void useMacroStore.persist.rehydrate()
      }
    }
  })
}
