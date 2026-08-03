// Remembers the last export, so the UI can say the library has moved on since.
//
// Export is the only copy that survives leaving the browser entirely -- no account, no vendor, no
// quota -- and its one weakness is that it depends on somebody remembering. This closes most of
// that gap for the cost of a stored timestamp and a checksum, without a new permission and without
// writing files behind the user's back.
//
// Local rather than sync, deliberately: "when did *this* machine last export" is the question worth
// answering. A file exported on a laptop is not on the desktop, so a synced timestamp would suppress
// the nudge exactly where the file is missing.
import type { Macro } from '../types'
import { measureMacros } from './checksum'

const KEY = 'last-export'

export interface LastExport {
  at: string
  checksum: string
  count: number
}

export async function readLastExport(): Promise<LastExport | null> {
  const stored = await chrome.storage.local.get(KEY)
  const record = stored[KEY] as LastExport | undefined
  return record && typeof record.at === 'string' ? record : null
}

export async function recordExport(macros: Macro[]): Promise<LastExport> {
  const record: LastExport = {
    at: new Date().toISOString(),
    checksum: measureMacros(macros).checksum,
    count: macros.length,
  }
  await chrome.storage.local.set({ [KEY]: record })
  return record
}

/**
 * Whether the library differs from what was last exported.
 *
 * By checksum rather than by counting, because the case that matters most is the one a count
 * misses: a macro edited rather than added or removed leaves the total identical.
 */
export function hasDivergedFromExport(macros: Macro[], last: LastExport | null): boolean {
  if (last === null) return false
  return measureMacros(macros).checksum !== last.checksum
}
