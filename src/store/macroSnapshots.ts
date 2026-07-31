// Automatic local backups of the macro library.
//
// This is the layer that protects against the user's own mistakes -- a bulk delete, a bad
// import, an edit that turned out wrong -- which is a different failure from losing the device,
// and needs a different answer. `chrome.storage.local` removes every constraint that made the
// cross-device design interesting: no 8192-byte item cap, ~10 MB of quota, no propagation and so
// no arrival order. A snapshot is therefore one key holding the whole serialized library. No
// chunking, no alternating slots.
//
// The decision that actually matters here is retention, because the obvious policy defends the
// wrong failure. A flat ring of "the last N snapshots" assumes mistakes are noticed immediately.
// They are not: the user carries on working, each change writes another snapshot, and the last
// good state is churned out of the buffer by the very edits made after the damage. So retention
// is tiered -- a handful of recent changes, then one per hour for a day, then one per day for a
// fortnight. A mistake found on Thursday is still recoverable from Monday.
//
// Snapshots hold macros only. Restoring last Tuesday's theme and language because the macro
// library was wanted back is a surprise, and config is small and re-settable by hand.
import type { Macro } from '../types'

const INDEX_KEY = 'macro-snapshots'
const PAYLOAD_PREFIX = 'macro-snapshot:'

const RECENT_KEEP = 5
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const HOURLY_WINDOW_MS = DAY_MS
const DAILY_WINDOW_MS = 14 * DAY_MS

export interface SnapshotMeta {
  rev: number
  /** ISO timestamp, for bucketing and for telling the user which one they are restoring. */
  takenAt: string
  checksum: string
  /** How many macros it holds, so the UI can say so without reading the payload. */
  count: number
}

interface SnapshotIndex {
  rev: number
  entries: SnapshotMeta[]
}

const payloadKey = (rev: number) => `${PAYLOAD_PREFIX}${rev}`

/**
 * A cheap, stable digest. Not cryptographic -- nothing here defends against an adversary, it only
 * has to answer "is this the same library as last time". Length is folded in alongside the hash
 * because two texts colliding on both is far less likely than on either, and the cost of a false
 * match is a snapshot silently not taken.
 */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

export function checksumMacros(macros: Macro[]): string {
  const serialized = JSON.stringify(macros)
  return `${serialized.length}-${fnv1a(serialized)}`
}

/**
 * Decide which snapshots survive. Pure, because this is the part most likely to be wrong and the
 * part whose wrongness is invisible until someone needs a backup that is no longer there.
 *
 * Within a bucket the newest wins, which is the conventional choice and the one that makes
 * "restore from earlier today" mean what it says. The cost is that a mistake made and then worked
 * on inside the same hour can lose its pre-mistake state from that hour's bucket -- the preceding
 * hour still has it, and the five recent slots cover the fine grain.
 */
export function planRetention(
  entries: SnapshotMeta[],
  now: number
): { keep: SnapshotMeta[]; drop: SnapshotMeta[] } {
  const newestFirst = [...entries].sort((a, b) => b.rev - a.rev)
  const keep = new Set<number>()

  for (const entry of newestFirst.slice(0, RECENT_KEEP)) keep.add(entry.rev)

  const seenHour = new Set<number>()
  const seenDay = new Set<number>()
  for (const entry of newestFirst) {
    const takenAt = Date.parse(entry.takenAt)
    // An unparseable date cannot be bucketed, and discarding it would be deciding that a snapshot
    // we cannot place is a snapshot we do not need. Keep it and let the recent slots age it out.
    if (Number.isNaN(takenAt)) {
      keep.add(entry.rev)
      continue
    }
    const age = now - takenAt
    // Future-dated, so the clock moved. Not this function's problem to adjudicate, and dropping
    // a snapshot over it would be the wrong way to be opinionated.
    if (age < 0) {
      keep.add(entry.rev)
      continue
    }
    if (age <= HOURLY_WINDOW_MS) {
      const bucket = Math.floor(takenAt / HOUR_MS)
      if (!seenHour.has(bucket)) {
        seenHour.add(bucket)
        keep.add(entry.rev)
      }
    } else if (age <= DAILY_WINDOW_MS) {
      const bucket = Math.floor(takenAt / DAY_MS)
      if (!seenDay.has(bucket)) {
        seenDay.add(bucket)
        keep.add(entry.rev)
      }
    }
  }

  return {
    keep: newestFirst.filter((entry) => keep.has(entry.rev)),
    drop: newestFirst.filter((entry) => !keep.has(entry.rev)),
  }
}

/**
 * Which day a snapshot belongs to, from the user's point of view rather than the clock's. The
 * value of this feature is realized at the moment of panic, so the list has to read as "earlier
 * today" and "yesterday" -- not as timestamps the reader has to subtract.
 *
 * Calendar days in local time, and yesterday is found by stepping the date back rather than by
 * subtracting 24 hours, which would land an hour out on the days the clocks change.
 */
export function snapshotBucket(takenAt: string, now: number): 'today' | 'yesterday' | 'earlier' {
  // An unreadable date needs no guard of its own: every comparison below is false against NaN, so
  // it falls through to 'earlier' on its own. A guard here looked prudent and was unreachable.
  const then = new Date(takenAt)
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const thatDay = startOfDay(then)
  const today = startOfDay(new Date(now))
  if (thatDay >= today) return 'today'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return thatDay === startOfDay(yesterday) ? 'yesterday' : 'earlier'
}

async function readIndex(): Promise<SnapshotIndex> {
  const stored = await chrome.storage.local.get(INDEX_KEY)
  const index = stored[INDEX_KEY] as SnapshotIndex | undefined
  if (!index || !Array.isArray(index.entries)) return { rev: 0, entries: [] }
  return index
}

/**
 * Write a snapshot of `macros`, unless it matches the newest one already held.
 *
 * `force` skips that check, and exists for the one case that must never be coalesced away: the
 * snapshot taken immediately before a restore or an import, which are the operations most likely
 * to need undoing.
 *
 * Returns the snapshot written, or null when it was a duplicate.
 */
export async function takeSnapshot(macros: Macro[], { force = false } = {}): Promise<SnapshotMeta | null> {
  const checksum = checksumMacros(macros)
  const index = await readIndex()
  // By revision rather than by position. The index is written sorted, so the first entry is
  // normally the newest -- but "normally" is doing work there, and comparing against the wrong
  // snapshot means silently skipping a backup.
  const [newest] = [...index.entries].sort((a, b) => b.rev - a.rev)
  if (!force && newest?.checksum === checksum) return null

  const meta: SnapshotMeta = {
    rev: index.rev + 1,
    takenAt: new Date().toISOString(),
    checksum,
    count: macros.length,
  }
  const { keep, drop } = planRetention([meta, ...index.entries], Date.now())

  // Payload and index go in one call so the index never describes a snapshot that was not
  // written. Pruning follows separately: an orphaned payload wastes space, whereas an index
  // entry with no payload would be a restore that fails.
  await chrome.storage.local.set({
    [payloadKey(meta.rev)]: macros,
    [INDEX_KEY]: { rev: meta.rev, entries: keep } satisfies SnapshotIndex,
  })
  if (drop.length > 0) {
    await chrome.storage.local.remove(drop.map((entry) => payloadKey(entry.rev)))
  }
  return meta
}

/** Newest first, which is the order the UI wants and the order retention reasons in. */
export async function listSnapshots(): Promise<SnapshotMeta[]> {
  const index = await readIndex()
  return [...index.entries].sort((a, b) => b.rev - a.rev)
}

export async function readSnapshot(rev: number): Promise<Macro[] | null> {
  const stored = await chrome.storage.local.get(payloadKey(rev))
  const macros = stored[payloadKey(rev)] as Macro[] | undefined
  return Array.isArray(macros) ? macros : null
}
