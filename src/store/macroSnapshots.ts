// Automatic local backups of the macro library.
//
// This is the layer that protects against two of the user's own mistakes -- a bulk delete and a bad
// import -- which is a different failure from losing the device and needs a different answer. It
// deliberately does not try to serve the third, undoing an edit while composing a single macro:
// that is per-macro and frequent, and replacing the whole library to fix one macro's text would
// discard everything done since. `chrome.storage.local` removes every constraint that made the
// cross-device design interesting: no 8192-byte item cap, ~10 MB of quota, no propagation and so
// no arrival order. A snapshot is therefore one key holding the whole serialized library. No
// chunking, no alternating slots.
//
// The decision that actually matters here is when a snapshot is taken, and the answer arrived by
// being wrong first. Taking one on a timer produces a pile of near-identical copies and still
// misses the moment that counts; taking one immediately before a delete, an import or a restore
// captures exactly the state someone will come back for. A short daily tail covers the other case
// worth serving -- rolling back after a messy session -- and nothing else is kept.
//
// Snapshots hold macros only. Restoring last Tuesday's theme and language because the macro
// library was wanted back is a surprise, and config is small and re-settable by hand.
import type { Macro } from '../types'

const INDEX_KEY = 'macro-snapshots'
const PAYLOAD_PREFIX = 'macro-snapshot:'

// Retention is deliberately thin, and the reasoning is worth keeping because it reverses an
// earlier draft of this file.
//
// Snapshots serve exactly two failures well: a bulk delete, and "roll back to yesterday after a
// messy session". Both are whole-library events, both are rare. The third thing people reach for --
// undoing a botched edit while composing one macro -- is frequent and *cannot* be served by this at
// all: restoring the whole library to fix one macro's text discards everything done since.
//
// The old tiering (five recent, one an hour for a day, one a day for a fortnight) was sized as
// though snapshots were a general-purpose history. They are not, and the hourly tier in particular
// was capturing the composing case it could never help with -- which is where the redundancy the
// user objected to actually came from. So: snapshot when something dangerous is about to happen,
// keep a short daily tail for the rollback case, and stop there.
const RECENT_KEEP = 2
/** Forced snapshots survive longest, but not without limit -- a run of deletes should still age. */
const FORCED_KEEP = 5
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const DAILY_WINDOW_MS = 7 * DAY_MS

/**
 * How much of `chrome.storage.local` the whole snapshot set may occupy.
 *
 * The tiers bound the snapshot *count*, not the bytes, so the wall moves with the library. Half of it is deliberately left
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
  /**
   * Why this snapshot was taken. Absent on snapshots written before reasons existed, and on the
   * plain change-triggered ones, both of which mean the same thing here.
   *
   * It is what lets the list say "before you deleted 5 macros" instead of a fourth identical row of
   * "today, 16:28" -- and that sentence is the whole difference between a list someone can act on
   * at the moment of panic and one they have to decode.
   */
  reason?: SnapshotReason
}

export type SnapshotReason = 'change' | 'delete' | 'import' | 'restore'

/** A snapshot taken because something destructive was about to happen, rather than because time passed. */
const isForced = (entry: SnapshotMeta): boolean =>
  entry.reason !== undefined && entry.reason !== 'change'

/** Which rule earned an entry its place, and so the order in which places are given up. */
type Tier = 'forced' | 'recent' | 'daily' | 'unplaced'

// Least valuable first. `unplaced` leads because those entries are kept only because their
// timestamp could not be trusted enough to bucket them, so they are the least defensible thing to
// be spending the budget on. `forced` is last: a snapshot taken immediately before a delete or an
// import is the one someone will actually come looking for, and it is the only one whose moment
// cannot be reconstructed from any other.
const EVICTION_ORDER: readonly Tier[] = ['unplaced', 'daily', 'recent', 'forced']

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
 * Within a day the newest wins, which is the conventional choice and the one that makes "restore
 * from yesterday" mean what it says. The fine grain that a bucket loses is covered by the forced
 * snapshots, which sit at the moments worth returning to rather than at arbitrary times.
 */
export function planRetention(
  entries: SnapshotMeta[],
  now: number,
  { budgetBytes = SNAPSHOT_BUDGET_BYTES } = {}
): { keep: SnapshotMeta[]; drop: SnapshotMeta[] } {
  const newestFirst = [...entries].sort((a, b) => b.rev - a.rev)
  const tier = new Map<number, Tier>()

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
    if (now - takenAt <= DAILY_WINDOW_MS) {
      const bucket = Math.floor(takenAt / DAY_MS)
      if (!seenDay.has(bucket)) {
        seenDay.add(bucket)
        tier.set(entry.rev, 'daily')
      }
    }
  }

  // Then recent, then forced, each overwriting the last. An entry can qualify under several rules
  // and should be labelled by the one that protects it longest, because the label is what the
  // budget pass spends.
  for (const entry of newestFirst.slice(0, RECENT_KEEP)) tier.set(entry.rev, 'recent')
  for (const entry of newestFirst.filter(isForced).slice(0, FORCED_KEEP)) tier.set(entry.rev, 'forced')

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
export async function takeSnapshot(
  macros: Macro[],
  options: { force?: boolean; reason?: SnapshotReason } = {}
): Promise<SnapshotMeta | null> {
  return serialize(() => writeSnapshot(macros, options.force ?? false, options.reason ?? 'change'))
}

/**
 * One snapshot at a time.
 *
 * `writeSnapshot` is a read-modify-write over a single index key and `chrome.storage` offers no
 * transaction, so two overlapping calls both read the same index, both find their checksum
 * different from the same newest entry, and both write. The result is two identical snapshots
 * spending two retention slots -- found on a real profile, as revisions 5 and 6 holding byte-identical
 * libraries.
 *
 * It is reachable in ordinary use, not only under a reloading dev worker: an import takes a forced
 * snapshot while the storage change it causes schedules a debounced one.
 *
 * A promise chain serialises the callers inside one context, which is where the overlap observed
 * here came from. It cannot serialise across contexts -- the settings page forcing a snapshot at
 * the same moment as the service worker's timer is still possible -- and that is left alone
 * deliberately: the cost is a duplicated snapshot, never a lost one, and the cure for it is the
 * cross-context lock this design has already rejected once.
 */
let queue: Promise<unknown> = Promise.resolve()

function serialize<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work)
  // The chain must survive a rejection, or one failed snapshot would wedge every later one.
  queue = next.catch(() => undefined)
  return next
}

async function writeSnapshot(
  macros: Macro[],
  force: boolean,
  reason: SnapshotReason
): Promise<SnapshotMeta | null> {
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
    reason,
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
