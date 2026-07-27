import type { Macro } from "../../types"

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
    const envelope = typeof raw === 'string' ? JSON.parse(raw) as PersistedEnvelope : raw as PersistedEnvelope
    return envelope?.state?.macros
  } catch (error) {
    console.warn('[MONKY] Error parsing storage:', error)
    return undefined
  }
}

function toMacros(raw: unknown): Macro[] {
  if (!Array.isArray(raw)) return []
  return (raw as StoredMacro[]).map(m => ({
    id: m.id,
    command: m.command ?? m.trigger ?? "",
    text: m.text ?? "",
    html: m.html,
    contentType: m.contentType,
    is_sensitive: m.is_sensitive,
  }))
}

export async function loadMacros(): Promise<Macro[]> {
  const result = await chrome.storage.local.get("macro-storage")
  return toMacros(readMacros(result['macro-storage']))
}

export function listenMacrosChange(callback: (macros: Macro[]) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes['macro-storage']) {
      callback(toMacros(readMacros(changes['macro-storage'].newValue)))
    }
  })
}
