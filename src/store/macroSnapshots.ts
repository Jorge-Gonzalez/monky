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

/**
 * How much of `chrome.storage.local` the whole snapshot set may occupy.
 *
 * The tiers alone bound the snapshot *count* at about 42, not the bytes, so the wall moves with the
 * library: 42 copies of a 250 KB library is the entire 10 MB quota. Half of it is deliberately left
 * free because the two failures are not comparable -- losing an old snapshot is a disappointment,
 * whereas filling the quota breaks the write of the live library, which is the thing all of this
 * exists to protect.
 */
export const SNAPSHOT_BUDGET_BYTES = 5 * 1024 * 1024

/**
 * Kept whatever the budget says. Without a floor a library larger than the budget retains nothing,
 * which is worse than not having the feature: the user would be told backups exist and find none.
 */
const FLOOR_KEEP = 3

export interface SnapshotMeta {
  rev: number
  /** ISO timestamp, for bucketing and for telling the user which one they are restoring. */
  takenAt: string
  checksum: string
  /** How many macros it holds, so the UI can say so without reading the payload. */
  count: number
  /**
   * Serialized size, so the budget can weigh the set without reading every payload back.
   *
   * UTF-16 code units rather than UTF-8 bytes, which undercounts accented text -- fine for a
   * budget, and would not be for an exact quota assertion. Optional because snapshots written
   * before the budget existed carry none; those weigh zero and age out through the tiers instead,
   * which is the harmless direction to be wrong in.
   */
  bytes?: number
}

/** Which rule earned an entry its place, and so the order in which places are given up. */
type Tier = 'recent' | 'hourly' | 'daily' | 'unplaced'

// Least valuable first. `unplaced` leads because those entries are kept only because their
// timestamp could not be trusted enough to bucket them, so they are the least defensible thing to
// be spending the budget on; `recent` is last because the fine grain is what a panicking user
// reaches for.
const EVICTION_ORDER: readonly Tier[] = ['unplaced', 'daily', 'hourly', 'recent']

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

/**
 * Digest and size in one pass, because both come from the same serialization and computing it
 * twice to get two facts about it would be silly.
 */
export function measureMacros(macros: Macro[]): { checksum: string; bytes: number } {
  const serialized = JSON.stringify(macros)
  return { checksum: `${serialized.length}-${fnv1a(serialized)}`, bytes: serialized.length }
}

export function checksumMacros(macros: Macro[]): string {
  return measureMacros(macros).checksum
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
  now: number,
  { budgetBytes = SNAPSHOT_BUDGET_BYTES } = {}
): { keep: SnapshotMeta[]; drop: SnapshotMeta[] } {
  const newestFirst = [...entries].sort((a, b) => b.rev - a.rev)
  const tier = new Map<number, Tier>()

  const seenHour = new Set<number>()
  const seenDay = new Set<number>()
  for (const entry of newestFirst) {
    const takenAt = Date.parse(entry.takenAt)
    // An unparseable date cannot be bucketed, and discarding it would be deciding that a snapshot
    // we cannot place is a snapshot we do not need. Keep it and let the recent slots age it out.
    // Future-dated means the clock moved, which is not this function's to adjudicate either.
    if (Number.isNaN(takenAt) || now - takenAt < 0) {
      tier.set(entry.rev, 'unplaced')
      continue
    }
    const age = now - takenAt
    if (age <= HOURLY_WINDOW_MS) {
      const bucket = Math.floor(takenAt / HOUR_MS)
      if (!seenHour.has(bucket)) {
        seenHour.add(bucket)
        tier.set(entry.rev, 'hourly')
      }
    } else if (age <= DAILY_WINDOW_MS) {
      const bucket = Math.floor(takenAt / DAY_MS)
      if (!seenDay.has(bucket)) {
        seenDay.add(bucket)
        tier.set(entry.rev, 'daily')
      }
    }
  }

  // Last, so that a recent entry which also happens to open an hourly bucket is labelled by the
  // rule that should protect it longest. Membership is the same union as before; only the label
  // differs, and the label is what the budget pass spends.
  for (const entry of newestFirst.slice(0, RECENT_KEEP)) tier.set(entry.rev, 'recent')

  // The budget, spent cheapest-tier-first and oldest-first within a tier. The floor is taken by
  // revision rather than by timestamp so that a skewed clock cannot talk us out of the newest
  // snapshots -- revisions are monotonic, wall time is not.
  let total = newestFirst.reduce((sum, e) => (tier.has(e.rev) ? sum + (e.bytes ?? 0) : sum), 0)
  if (total > budgetBytes) {
    const floor = new Set(newestFirst.slice(0, FLOOR_KEEP).map((e) => e.rev))
    const oldestFirst = [...newestFirst].reverse()
    for (const victim of EVICTION_ORDER.flatMap((t) => oldestFirst.filter((e) => tier.get(e.rev) === t))) {
      if (total <= budgetBytes) break
      if (floor.has(victim.rev)) continue
      total -= victim.bytes ?? 0
      tier.delete(victim.rev)
    }
  }

  return {
    keep: newestFirst.filter((entry) => tier.has(entry.rev)),
    drop: newestFirst.filter((entry) => !tier.has(entry.rev)),
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
  const { checksum, bytes } = measureMacros(macros)
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
    bytes,
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
