import type { Macro } from '../../types'

// The store is persisted by zustand under 'macro-storage', which chrome.storage may hand
// back either as the object itself or as a JSON string. Everything read here is untrusted
// on the way in, so it is parsed defensively and narrowed once.

/** The envelope zustand's persist middleware writes. */
type PersistedEnvelope = { state?: { macros?: unknown } }

/**
 * A macro as it may appear in storage. Every field but the id may be missing or carry the
 * legacy `trigger` spelling; an entry without an id is not a macro we can address.
 */
type StoredMacro = Partial<Macro> & { id: Macro['id']; trigger?: string }

function readMacros(raw: unknown): unknown {
  try {
    const envelope =
      typeof raw === 'string' ? (JSON.parse(raw) as PersistedEnvelope) : (raw as PersistedEnvelope)
    return envelope?.state?.macros
  } catch (error) {
    console.warn('[MONKY] Error parsing storage:', error)
    return undefined
  }
}

function toMacros(raw: unknown): Macro[] {
  if (!Array.isArray(raw)) return []
  return (raw as StoredMacro[]).map((m) => ({
    id: m.id,
    command: m.command ?? m.trigger ?? '',
    text: m.text ?? '',
    html: m.html,
    contentType: m.contentType,
    is_sensitive: m.is_sensitive,
  }))
}

export async function loadMacros(): Promise<Macro[]> {
  const result = await chrome.storage.local.get('macro-storage')
  return toMacros(readMacros(result['macro-storage']))
}

/**
 * The stored macros exactly as persisted, for callers that must not normalise them.
 *
 * `toMacros` narrows to the six fields the detector needs, which is right for expansion and wrong
 * for a backup: a backup that reshapes its input is not a backup. It was silently dropping
 * `updated_at` -- the field the backend merge orders by -- so a restore would have made every
 * macro look as though it had never been edited. Any field added later would have gone the same
 * way, which is why this reads the array rather than adding one name to the narrowing.
 */
export async function loadStoredMacros(): Promise<Macro[] | null> {
  const result = await chrome.storage.local.get('macro-storage')
  const stored = readMacros(result['macro-storage'])
  // null rather than [] for absent or unreadable storage, so a caller can tell "no library yet"
  // from "a library with nothing in it" -- a backup should not record the second as the first.
  return Array.isArray(stored) ? (stored as Macro[]) : null
}

export function listenStoredMacrosChange(callback: (macros: Macro[]) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes['macro-storage']) {
      const stored = readMacros(changes['macro-storage'].newValue)
      if (Array.isArray(stored)) callback(stored as Macro[])
    }
  })
}

/**
 * Both sides of a change, for callers that need to say what happened rather than what is now true.
 *
 * The change event already carries `oldValue`, which is the only reason the edit log can describe a
 * change without keeping state of its own. That matters in a service worker: anything remembered
 * between events is lost when the worker is suspended, and a log that silently stopped describing
 * changes after every suspension would be worse than no log.
 *
 * `before` is null when storage held nothing readable, which is a first write rather than an edit.
 */
export function listenStoredMacrosDiff(
  callback: (before: Macro[] | null, after: Macro[]) => void
): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes['macro-storage']) return
    const after = readMacros(changes['macro-storage'].newValue)
    if (!Array.isArray(after)) return
    const before = readMacros(changes['macro-storage'].oldValue)
    callback(Array.isArray(before) ? (before as Macro[]) : null, after as Macro[])
  })
}

export function listenMacrosChange(callback: (macros: Macro[]) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes['macro-storage']) {
      callback(toMacros(readMacros(changes['macro-storage'].newValue)))
    }
  })
}
