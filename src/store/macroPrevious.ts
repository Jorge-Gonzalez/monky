// The library as it stood immediately before something destructive.
//
// This replaces a snapshot subsystem that kept a browsable history -- five recent, one an hour for a
// day, one a day for a fortnight, with retention tiers, an eviction order and a byte budget. It was
// the wrong shape twice over. It could not serve the case people actually reach for, undoing an edit
// while composing one macro, because restoring a whole library to fix one macro's text discards
// everything done since. And the history it did keep leaked into the interface as a list of
// near-identical rows that a person in trouble had to decode before they could choose.
//
// What survives is the one case that is genuinely whole-library and genuinely costly: you deleted a
// selection, or imported over the top, and want it back. So this keeps the state from just before
// each such act and nothing else. No tiers, no budget, no schedule.
//
// Written *only* before a destructive operation, never on ordinary edits. That is what lets it stay
// useful: the realistic way a bulk delete is discovered in a text expander is typing a macro weeks
// later and getting nothing, and a copy that moved on every edit would have been overwritten long
// before then.
import type { Macro } from '../types'
import { measureMacros } from './checksum'

const KEY = 'macro-previous'

/**
 * Two, not one. Delete-then-import would otherwise leave only the pre-import state, having lost the
 * pre-delete one to it. Two costs a second copy and no policy: keep the newest two, drop the rest.
 *
 * Note this is *not* the reason `chrome.storage.sync` uses two slots. There, a second slot exists
 * because a write can tear or half-propagate and must not damage the readable copy. A single-key
 * `chrome.storage.local.set` is atomic, so here the second entry buys depth and nothing else.
 */
const KEEP = 2

export type PreviousReason = 'delete' | 'import' | 'restore'

export interface PreviousState {
  /** ISO timestamp of the moment just before the destructive act. */
  at: string
  reason: PreviousReason
  /** How many macros it holds, so a list can describe it without loading the payload. */
  count: number
  /** For de-duplicating against other recovery sources holding the same library. */
  checksum: string
  macros: Macro[]
}

interface Stored {
  entries: PreviousState[]
}

/**
 * Newest first. One key holds both the descriptions and the payloads: at two entries of a few
 * kilobytes there is nothing to gain from the index-plus-payload split the snapshots needed, and a
 * single key removes the failure where an index describes a payload that is not there.
 */
export async function readPrevious(): Promise<PreviousState[]> {
  const stored = await chrome.storage.local.get(KEY)
  const value = stored[KEY] as Stored | undefined
  if (!value || !Array.isArray(value.entries)) return []
  return value.entries.filter((entry) => Array.isArray(entry.macros))
}

/**
 * Record the library as it stands, before the caller changes it.
 *
 * Skips a write identical to the newest entry -- undoing a restore and immediately restoring again
 * should not spend both slots on the same library.
 */
export async function keepPrevious(macros: Macro[], reason: PreviousReason): Promise<PreviousState | null> {
  const { checksum } = measureMacros(macros)
  const entries = await readPrevious()
  if (entries[0]?.checksum === checksum) return null

  const entry: PreviousState = {
    at: new Date().toISOString(),
    reason,
    count: macros.length,
    checksum,
    macros,
  }
  await chrome.storage.local.set({ [KEY]: { entries: [entry, ...entries].slice(0, KEEP) } satisfies Stored })
  return entry
}

export const PREVIOUS_KEEP = KEEP
