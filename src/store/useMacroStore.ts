import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { defaultMacroConfig } from '../config/defaults'
import { dummyMacros } from '../config/defaults'
import type { Macro, ThemeMode, Lang, Config, verticalPlacement, ColorTheme } from '../types'

type StoreOpResult = { success: boolean; error?: string }

type MacroStore = {
  macros: Macro[]
  config: Config
  setMacros: (m: Macro[]) => void
  addMacro: (m: Macro) => StoreOpResult
  updateMacro: (id: Macro['id'], patch: Partial<Macro>) => StoreOpResult
  deleteMacros: (ids: Macro['id'][]) => void
  setPrefixes: (prefixes: string[]) => void
  setUseCommitKeys: (useCommitKeys: boolean) => void
  toggleSiteDisabled: (hostname: string) => void
  setTheme: (theme: ThemeMode) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  setLanguage: (language: Lang) => void
  setConfig: (config: Partial<Config>) => void
}

/**
 * The slice that actually reaches storage, which is currently the whole of the state worth
 * keeping. Declared anyway: bytes here are spent against the 8192 `chrome.storage.sync` allows an
 * item, a budget this state was measured 221 short of, so what goes in wants deciding rather than
 * inheriting. The rule is the one the snapshot layer follows -- store what has to be restored, and
 * nothing else.
 *
 * It has already earned its keep once. `user` and `syncStatus` were persisted for a hosted backend
 * that was never switched on; both were written to disk on every change and read nowhere.
 */
type PersistedMacroStore = Pick<MacroStore, 'macros' | 'config'>

// --- Standalone helper function ---
function commandExists(macros: Macro[], command: string, currentId?: Macro['id']): boolean {
  return macros.some((m) => m.command === command && String(m.id) !== String(currentId))
}

/**
 * Where the bytes go when `macro-storage` will not parse.
 *
 * Kept, never overwritten, and never read back automatically: the value of an unreadable authority
 * is that a person can look at it. Only the first failure is preserved -- a later one would be
 * further from the good data, and letting it overwrite the first would lose the better copy.
 */
const QUARANTINE_KEY = 'macro-storage-unreadable'

/** A parseable envelope holding no macros, so hydration cannot invent any. */
const EMPTY_LIBRARY = '{"state":{"macros":[],"config":{}},"version":0}'

async function quarantineUnreadableAuthority(raw: string): Promise<void> {
  const existing = await chrome.storage.local.get(QUARANTINE_KEY)
  if (existing[QUARANTINE_KEY] === undefined) {
    await chrome.storage.local.set({
      [QUARANTINE_KEY]: { at: new Date().toISOString(), raw },
    })
  }
  console.error(
    `[MONKY] the stored macro library could not be parsed. The unreadable value has been kept under ` +
      `"${QUARANTINE_KEY}" and the library has loaded empty rather than seeded, so nothing overwrites it. ` +
      `Recovery points from before this are still available in settings.`
  )
}

// The serialized value this context most recently wrote. Used to ignore the
// storage.onChanged echo of our own writes (see the onChanged listener below),
// which would otherwise re-read storage and re-notify subscribers needlessly.
let lastWrittenValue: string | null = null

// `chrome.storage.local` is the authority, and the only thing read back.
//
// It used to read `chrome.storage.sync` first and fall back to local, while writing local
// always and sync best-effort inside a swallowed catch. Those two halves combine badly. Sync
// caps an item at 8192 bytes -- measured, this state was 7971 of them, 221 short -- and past
// that line the write rejects, the catch eats it, and sync silently freezes at its last good
// value. That frozen value is not null, so it goes on winning the read: the store hydrates
// stale and the next write persists the stale state back over the good local copy. MDN says
// the same thing in the abstract about storage.sync, that "server values take precedence
// during sync, potentially overwriting local updates".
//
// Reading local only, rather than local-first, is what the usage model allows: macros are not
// edited on two machines at once, so hydration has nothing to gain from consulting sync and a
// whole failure mode to lose. Sync stops being a silent input. Cross-device recovery belongs
// to an explicit, confirmed restore, where the user is present to see which copy they chose.
//
// The best-effort sync copy that used to live here is gone, and its removal is the point rather
// than a tidy-up. It wrote the *whole persisted envelope* under one key, and that envelope stopped
// fitting the 8192-byte item cap some time ago -- so every macro change since had been attempting a
// write that could only reject, while a stale copy squatted on ~7.4 KB of the browser account's
// quota. Measured on a real profile: 26 macros frozen against 28 live ones, and it was the entire
// 8 KB the settings readout was reporting.
//
// Layer 2 replaces it properly -- chunked under the item cap, checksummed, written on a debounce
// and read back only on an explicit restore. Two mechanisms writing the same library to the same
// storage area, one of them permanently broken, is worse than one that works.
const chromeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const local = await chrome.storage.local.get(name)
    const raw = local[name] as string | undefined
    // Genuinely nothing stored: a first run. Seeded defaults are the right answer.
    if (raw === undefined) return null
    try {
      JSON.parse(raw)
    } catch {
      await quarantineUnreadableAuthority(raw)
      // An empty library rather than null, and the difference is the whole point. Returning null
      // would let the store hydrate to the seeded sample macros -- and the next ordinary edit would
      // then persist those samples straight over the bytes that failed to parse.
      //
      // Measured, not feared: a single truncated value produced seven demo macros and a write that
      // destroyed a string a person could very likely have repaired by hand. That is the same shape
      // as the bug this file was rewritten to fix, one layer down: something that is not the
      // authority winning, and overwriting what is.
      //
      // Empty is also the honest answer. We do not know what the library held, so presenting none
      // is truthful where presenting demos would look like a fresh install and invite the user to
      // start typing over their own data.
      return EMPTY_LIBRARY
    }
    return raw
  },
  setItem: async (name: string, value: string): Promise<void> => {
    lastWrittenValue = value
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
      // Seed the full defaults so config is always complete (the persist merge
      // backfills any field missing from older persisted state).
      config: { ...defaultMacroConfig },

      // --- Actions ---
      setMacros: (macros) => set({ macros }),
      addMacro: (macro) => {
        if (commandExists(get().macros, macro.command)) {
          const error = `El comando "${macro.command}" ya existe.`
          return { success: false, error }
        }
        set((s) => ({ macros: [...s.macros, macro] }))
        return { success: true }
      },
      updateMacro: (id, patch) => {
        if (patch.command && commandExists(get().macros, patch.command, id)) {
          const error = `El comando "${patch.command}" ya existe.`
          return { success: false, error }
        }
        set((s) => ({ macros: s.macros.map((m) => (String(m.id) === String(id) ? { ...m, ...patch } : m)) }))
        return { success: true }
      },
      // Takes every id at once so that deleting a multiple selection is one state transition:
      // one filter pass, one notification, and no render showing the list half-deleted.
      deleteMacros: (ids) =>
        set((s) => {
          const gone = new Set(ids.map(String))
          return { macros: s.macros.filter((m) => !gone.has(String(m.id))) }
        }),
      setPrefixes: (prefixes) => set((s) => ({ config: { ...s.config, prefixes } })),
      setUseCommitKeys: (useCommitKeys) => set((s) => ({ config: { ...s.config, useCommitKeys } })),
      setTheme: (theme: ThemeMode) => set((s) => ({ config: { ...s.config, theme } })),
      setColorTheme: (colorTheme: ColorTheme) => set((s) => ({ config: { ...s.config, colorTheme } })),
      setLanguage: (language: Lang) => set((s) => ({ config: { ...s.config, language } })),
      // Merged over what is there rather than replacing it, because the caller is a restore and a
      // copy may predate a preference: an older backup that never knew about a field must leave
      // this device's value alone rather than blanking it.
      setConfig: (config: Partial<Config>) => set((s) => ({ config: { ...s.config, ...config } })),
      setSuggestionsPlacement: (placement: verticalPlacement) =>
        set((s) => ({ config: { ...s.config, suggestionsPopupPlacement: placement } })),
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
      partialize: (state): PersistedMacroStore => ({ macros: state.macros, config: state.config }),
      /**
       * Deep-merges `config` so that new defaults added to `defaultMacroConfig` survive an older
       * persisted state that predates them, and takes `macros` verbatim when storage holds any --
       * an empty array is a library the user emptied, not an absent one, so it must win over the
       * seeded defaults.
       *
       * Reading through the two named fields rather than spreading the whole persisted object also
       * migrates state written before `partialize`: `user` and `syncStatus` are simply not carried
       * across, so the first write after this lands drops them without a version bump.
       */
      merge: (persistedState: unknown, currentState) => {
        const persisted = persistedState as Partial<PersistedMacroStore> | undefined
        return {
          ...currentState,
          macros: persisted?.macros ?? currentState.macros,
          config: { ...currentState.config, ...persisted?.config },
        }
      },
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
    // Local only, because local is the only area read back. A sync change used to rehydrate
    // too, which is how a stale sync copy reached the UI; now it would only re-read local and
    // find what is already there. Same rule as the content script's own listener, which has
    // watched local alone all along -- the two contexts no longer disagree about which storage
    // area is authoritative.
    if (area === 'local') {
      const storeName = useMacroStore.persist.getOptions().name
      const change = storeName ? changes[storeName] : undefined
      // Ignore the echo of our own writes: a change whose value matches what we just persisted
      // carries no new information, and re-reading it is what made the settings controls
      // flicker. Genuine external changes (the popup, the editor page) carry a different value
      // and still rehydrate.
      if (change && change.newValue !== lastWrittenValue) {
        void useMacroStore.persist.rehydrate()
      }
    }
  })
}
