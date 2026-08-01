// What changed, where, and when -- the label that replaced a lock.
//
// An earlier design would have enforced single-device ownership: one device holds the library, a
// newer sign-in takes it, older devices go read-only. That needs a lease, a lease needs a
// coordinator, and `chrome.storage.sync` cannot be one -- it has no compare-and-swap and no
// ordering guarantee, so two devices can each read "unheld" and each conclude they hold it.
//
// What the lease was reaching for was information at the moment two libraries meet, and that moment
// is already gated behind an explicit restore. So this records changes instead of forbidding them,
// and the restore prompt can say "last changed on another device two hours ago -- three deleted,
// one edited" rather than asking the user to overwrite a library sight unseen.
//
// It lives in its own sync key, not inside the backup payload. Separate items carry separate
// 8192-byte budgets and the 512-item limit is nowhere near, so it never competes with the library
// for room -- and it stays readable when the payload write is the thing that failed, which is
// exactly when someone needs to know what happened.
import type { Macro } from '../types'

const KEY = 'edit-log'

/**
 * Bounded, because this is context rather than an audit trail. Twelve entries at roughly 60 bytes
 * is well inside one item, and the questions it answers -- what happened recently, on which device
 * -- stop being answerable long before they stop being asked.
 */
const KEEP = 12

export type EditKind = 'create' | 'update' | 'delete'

export interface EditEvent {
  /** ISO timestamp. */
  at: string
  /** Device id, so a restore can say *where* rather than only *when*. */
  dev: string
  kind: EditKind
  n: number
}

/**
 * Describe a change as counts per kind.
 *
 * One change can be several kinds at once -- an import adds some and skips others, a bulk edit
 * touches many -- so this returns an entry per kind that actually occurred rather than collapsing
 * to a single dominant one. Collapsing would make "3 deleted, 1 edited" unsayable, which is the
 * sentence the whole feature exists to produce.
 *
 * Compared by id, and then by serialization for the ids present on both sides. `updated_at` would
 * be the cheaper comparison and the wrong one: it is stamped by macroCrud, so anything written by
 * another path would look unchanged.
 */
export function summarizeChange(before: Macro[] | null, after: Macro[]): { kind: EditKind; n: number }[] {
  // No previous value is a first write, not an edit. Reporting a whole library as freshly created
  // would bury the real history under one meaningless entry.
  if (before === null) return []

  const previous = new Map(before.map((macro) => [String(macro.id), macro]))
  const current = new Map(after.map((macro) => [String(macro.id), macro]))

  let created = 0
  let updated = 0
  for (const [id, macro] of current) {
    const was = previous.get(id)
    if (was === undefined) created++
    else if (JSON.stringify(was) !== JSON.stringify(macro)) updated++
  }
  const deleted = [...previous.keys()].filter((id) => !current.has(id)).length

  const summary: { kind: EditKind; n: number }[] = []
  if (created > 0) summary.push({ kind: 'create', n: created })
  if (updated > 0) summary.push({ kind: 'update', n: updated })
  if (deleted > 0) summary.push({ kind: 'delete', n: deleted })
  return summary
}

export async function readEditLog(): Promise<EditEvent[]> {
  const stored = await chrome.storage.sync.get(KEY)
  const log: unknown = stored[KEY]
  return Array.isArray(log) ? (log as EditEvent[]) : []
}

/** Newest last, trimmed to the most recent KEEP. A no-op for an empty summary. */
export async function appendEditEvents(
  summary: { kind: EditKind; n: number }[],
  device: string,
  at: string = new Date().toISOString()
): Promise<EditEvent[] | null> {
  if (summary.length === 0) return null
  const log = await readEditLog()
  const next = [...log, ...summary.map(({ kind, n }) => ({ at, dev: device, kind, n }))].slice(-KEEP)
  await chrome.storage.sync.set({ [KEY]: next })
  return next
}

export interface EditsSince {
  n: number
  /** True when the log was trimmed past the moment asked about, so `n` is a floor and not a count. */
  truncated: boolean
}

/**
 * How much has changed since a given moment, for the export nudge.
 *
 * Honest about its own limits: the log is bounded, so if its oldest entry is already newer than the
 * moment asked about then entries have been lost and the true number is higher. Saying "12+" is
 * worth more than quietly reporting a number that is wrong.
 */
export function editsSince(log: EditEvent[], since: string | null): EditsSince {
  if (since === null) return { n: 0, truncated: false }
  const cutoff = Date.parse(since)
  if (Number.isNaN(cutoff)) return { n: 0, truncated: false }
  const after = log.filter((event) => Date.parse(event.at) > cutoff)
  const oldest = log[0]
  const truncated =
    log.length >= KEEP && oldest !== undefined && Date.parse(oldest.at) > cutoff
  return { n: after.reduce((sum, event) => sum + event.n, 0), truncated }
}

export const EDIT_LOG_KEEP = KEEP
