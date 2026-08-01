// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../types'
import {
  checksumMacros,
  planRetention,
  takeSnapshot,
  listSnapshots,
  readSnapshot,
  snapshotBucket,
  type SnapshotMeta,
} from './macroSnapshots'

// A local-storage stand-in with the two behaviours that matter: get returns only the asked-for
// keys, and set merges rather than replaces.
function installStorage() {
  const area = new Map<string, unknown>()
  const local = {
    get: vi.fn((key: string) => Promise.resolve(area.has(key) ? { [key]: area.get(key) } : {})),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.entries(items).forEach(([key, value]) => area.set(key, value))
      return Promise.resolve()
    }),
    remove: vi.fn((keys: string[] | string) => {
      ;(Array.isArray(keys) ? keys : [keys]).forEach((key) => area.delete(key))
      return Promise.resolve()
    }),
  }
  ;(globalThis as unknown as { chrome: unknown }).chrome = { storage: { local } }
  return { area, local }
}

const macro = (id: string, text = 'x'): Macro => ({
  id,
  command: `/${id}`,
  text,
  contentType: 'text/plain',
})

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const NOW = Date.parse('2026-07-30T12:00:00.000Z')

const at = (rev: number, msAgo: number, checksum = `c${rev}`): SnapshotMeta => ({
  rev,
  takenAt: new Date(NOW - msAgo).toISOString(),
  checksum,
  count: 1,
})

/** Same, with a weight, for the tests that are about the byte budget rather than the clock. */
const sized = (rev: number, msAgo: number, bytes: number): SnapshotMeta => ({
  ...at(rev, msAgo),
  bytes,
})

describe('checksumMacros', () => {
  it('is stable for the same library and different for a changed one', () => {
    expect(checksumMacros([macro('a')])).toBe(checksumMacros([macro('a')]))
    expect(checksumMacros([macro('a')])).not.toBe(checksumMacros([macro('b')]))
  })

  it('notices a change to text, not just to the set of macros', () => {
    expect(checksumMacros([macro('a', 'one')])).not.toBe(checksumMacros([macro('a', 'two')]))
  })

  it('notices order, since order is what the list shows', () => {
    expect(checksumMacros([macro('a'), macro('b')])).not.toBe(checksumMacros([macro('b'), macro('a')]))
  })

  it('distinguishes an empty library from no library at all', () => {
    expect(checksumMacros([])).toBe(checksumMacros([]))
    expect(checksumMacros([])).not.toBe(checksumMacros([macro('a')]))
  })

  it('encodes the serialized length alongside the hash', () => {
    // The contract rather than an example, because a hash collision cannot be constructed to
    // order. Carrying the length means a false match needs agreement on both, and a false match
    // here is a backup silently not taken.
    const macros = [macro('a'), macro('b')]
    expect(checksumMacros(macros).startsWith(`${JSON.stringify(macros).length}-`)).toBe(true)
  })
})

describe('snapshotBucket', () => {
  // Local calendar days, because "earlier today" is the user's day rather than the clock's.
  const noon = Date.parse('2026-07-30T12:00:00.000Z')
  const local = (iso: string) => new Date(iso).toISOString()

  it('calls anything on the same local day today', () => {
    const justNow = new Date(noon - 60_000).toISOString()
    expect(snapshotBucket(justNow, noon)).toBe('today')
  })

  it('calls the previous local day yesterday', () => {
    const yesterday = new Date(noon)
    yesterday.setDate(yesterday.getDate() - 1)
    expect(snapshotBucket(local(yesterday.toISOString()), noon)).toBe('yesterday')
  })

  it('steps the date back rather than subtracting a day, so the clock changes do not shift it', () => {
    // Two days back is never "yesterday" whatever the offset did in between.
    const twoDaysBack = new Date(noon)
    twoDaysBack.setDate(twoDaysBack.getDate() - 2)
    expect(snapshotBucket(local(twoDaysBack.toISOString()), noon)).toBe('earlier')
  })

  it('calls a future timestamp today rather than inventing a label for it', () => {
    expect(snapshotBucket(new Date(noon + 60_000).toISOString(), noon)).toBe('today')
  })

  it('falls back to earlier for a date it cannot read', () => {
    expect(snapshotBucket('not a date', noon)).toBe('earlier')
  })
})

describe('planRetention — the recent slots', () => {
  it('keeps the five newest whatever their age', () => {
    const entries = [at(9, 0), at(8, 1), at(7, 2), at(6, 3), at(5, 4), at(4, 40 * DAY)]
    const { keep, drop } = planRetention(entries, NOW)
    expect(keep.map((e) => e.rev)).toEqual([9, 8, 7, 6, 5])
    expect(drop.map((e) => e.rev)).toEqual([4])
  })

  it('is not fooled by entries arriving out of order', () => {
    const entries = [at(1, 5 * DAY), at(9, 0), at(5, 2 * DAY)]
    expect(planRetention(entries, NOW).keep.map((e) => e.rev)).toEqual([9, 5, 1])
  })
})

describe('planRetention — the hourly window', () => {
  it('keeps one per hour for the last day, the newest in each', () => {
    // Three in the same hour, three hours back. Only the newest of the three survives, and it
    // survives on the hourly rule rather than on a recent slot.
    const entries = [
      at(1, 3 * HOUR),
      at(2, 3 * HOUR - 60_000),
      at(3, 3 * HOUR - 120_000),
      at(4, 5 * HOUR),
      at(5, 7 * HOUR),
      at(6, 9 * HOUR),
      at(7, 11 * HOUR),
      at(8, 13 * HOUR),
    ]
    const { keep, drop } = planRetention(entries, NOW)
    expect(keep.map((e) => e.rev).sort((a, b) => a - b)).toEqual([3, 4, 5, 6, 7, 8])
    expect(drop.map((e) => e.rev).sort((a, b) => a - b)).toEqual([1, 2])
  })

  it('survives the mistake-noticed-later case', () => {
    // The scenario the tiering exists for: a bad edit two hours ago, then a burst of work after
    // it. A flat ring of five would have churned the pre-mistake state out; the hourly bucket
    // for the earlier hour still holds it.
    const good = at(1, 4 * HOUR)
    const entries = [good, ...[2, 3, 4, 5, 6, 7].map((rev) => at(rev, HOUR - rev * 1000))]
    expect(planRetention(entries, NOW).keep.map((e) => e.rev)).toContain(good.rev)
  })
})

describe('planRetention — the daily window', () => {
  // Revisions ascend with recency here, because that is what they do: each snapshot takes the
  // next revision and a later timestamp. An earlier draft of this test invented a fixture where
  // the highest revision was the oldest entry, and the recent slots -- which count by revision --
  // duly kept the wrong five.
  it('keeps one per day out to a fortnight, then stops', () => {
    const entries = [
      at(1, 40 * DAY),
      at(2, 15 * DAY),
      at(3, 13 * DAY),
      at(4, 5 * DAY),
      at(5, 2 * DAY),
      at(6, 2 * DAY - HOUR),
      at(7, 3 * HOUR),
      at(8, 2 * HOUR),
      at(9, HOUR),
      at(10, 0),
    ]
    const { keep, drop } = planRetention(entries, NOW)
    // 6 and 5 share a day; the newer wins. 2 is past the fortnight, 1 long past it.
    expect(keep.map((e) => e.rev).sort((a, b) => a - b)).toEqual([3, 4, 6, 7, 8, 9, 10])
    expect(drop.map((e) => e.rev).sort((a, b) => a - b)).toEqual([1, 2, 5])
  })
})

describe('takeSnapshot — overlapping callers', () => {
  it('does not write the same library twice when two calls overlap', async () => {
    // Found on a real profile as revisions 5 and 6 holding byte-identical libraries. takeSnapshot
    // is a read-modify-write over one index key and chrome.storage has no transaction, so without
    // serialising, both calls read the same index, both find their checksum different from the
    // same newest entry, and both write. Reachable in ordinary use: an import forces a snapshot
    // while the storage change it causes schedules a debounced one.
    installStorage()
    const macros = [macro('a')]
    const [first, second] = await Promise.all([takeSnapshot(macros), takeSnapshot(macros)])
    expect([first, second].filter(Boolean)).toHaveLength(1)
    expect(await listSnapshots()).toHaveLength(1)
  })

  it('still honours a forced snapshot that overlaps an automatic one', async () => {
    // Forcing exists for the write that must never be coalesced away -- the one taken immediately
    // before a restore or an import. Serialising must not turn it into a no-op.
    installStorage()
    const macros = [macro('a')]
    await Promise.all([takeSnapshot(macros), takeSnapshot(macros, { force: true })])
    expect(await listSnapshots()).toHaveLength(2)
  })

  it('keeps serving later callers after one of them fails', async () => {
    const store = installStorage()
    store.local.set.mockRejectedValueOnce(new Error('quota'))
    await expect(takeSnapshot([macro('a')])).rejects.toThrow('quota')
    // A wedged queue would make every later snapshot silently never happen.
    expect(await takeSnapshot([macro('b')])).not.toBeNull()
  })
})

describe('planRetention — the byte budget', () => {
  // The tiers bound how many snapshots survive, never how large they are, so the wall moves with
  // the library: ~42 copies of a 250 KB library is the whole 10 MB of chrome.storage.local.
  //
  // Every case here uses more than RECENT_KEEP entries on purpose. An earlier draft used exactly
  // five, which labels every one of them `recent` -- the assertions still passed, because
  // oldest-first inside a single tier happens to give the same answer, so the tier ordering these
  // tests exist for was never exercised at all.
  //
  // The budget is passed explicitly rather than leaning on the 5 MB default: that number is policy
  // and should be free to move without rewriting the tests that describe the mechanism.
  const ladder = (): SnapshotMeta[] => [
    sized(10, 0, 100), // recent
    sized(9, 60_000, 100), // recent
    sized(8, 120_000, 100), // recent
    sized(7, 180_000, 100), // recent
    sized(6, 240_000, 100), // recent
    sized(5, 2 * HOUR, 100), // hourly
    sized(4, 5 * HOUR, 100), // hourly
    sized(3, 2 * DAY, 100), // daily
    sized(2, 4 * DAY, 100), // daily
    sized(1, 6 * DAY, 100), // daily
  ]

  it('leaves the tiers alone while the set fits', () => {
    expect(planRetention(ladder(), NOW, { budgetBytes: 10_000 }).drop).toEqual([])
  })

  it('gives up the daily tier before the hourly one', () => {
    // Room for eight of the ten: both go from the daily end, and the hourly pair is untouched.
    const { keep, drop } = planRetention(ladder(), NOW, { budgetBytes: 800 })
    expect(drop.map((e) => e.rev)).toEqual([2, 1])
    expect(keep.map((e) => e.rev)).toEqual([10, 9, 8, 7, 6, 5, 4, 3])
  })

  it('moves on to the hourly tier only once the daily one is exhausted', () => {
    const { drop } = planRetention(ladder(), NOW, { budgetBytes: 600 })
    expect(drop.map((e) => e.rev)).toEqual([4, 3, 2, 1])
  })

  it('gives up the least defensible entries first — those it could not place at all', () => {
    // rev 5 claims to be from the future, so it is kept only because the clock cannot be trusted.
    // That makes it the first thing to stop paying for.
    const entries = [...ladder().filter((e) => e.rev !== 5), sized(5, -2 * DAY, 100)]
    expect(planRetention(entries, NOW, { budgetBytes: 900 }).drop.map((e) => e.rev)).toEqual([5])
  })

  it('keeps the three newest however small the budget', () => {
    // A library larger than the whole budget must not retain nothing: being told backups exist and
    // finding none is worse than never having offered them.
    const { keep } = planRetention(ladder(), NOW, { budgetBytes: 10 })
    expect(keep.map((e) => e.rev)).toEqual([10, 9, 8])
  })

  it('protects the newest by revision, not by timestamp', () => {
    // A skewed clock must not argue the newest snapshots out of the floor. rev 10 says it is a
    // week old; it is still the highest revision and still survives a budget of nothing.
    const entries = [...ladder().filter((e) => e.rev !== 10), sized(10, 7 * DAY, 100)]
    expect(planRetention(entries, NOW, { budgetBytes: 10 }).keep.map((e) => e.rev)).toContain(10)
  })

  it('stops evicting the moment the set fits, rather than draining the tier', () => {
    const { keep } = planRetention(ladder(), NOW, { budgetBytes: 900 })
    expect(keep.map((e) => e.rev)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2])
  })

  it('treats a snapshot written before the budget as weightless rather than as free to drop', () => {
    // No `bytes` means "unknown", and unknown must not read as "huge" -- these predate the field
    // and are left to age out through the tiers instead.
    const entries = ladder().map(({ bytes: _bytes, ...rest }) => rest)
    expect(planRetention(entries, NOW, { budgetBytes: 1 }).drop).toEqual([])
  })
})

describe('planRetention — clocks', () => {
  // The odd entry has to sit outside the five recent slots for these to test anything. An earlier
  // draft gave it the highest revision, so the recent slots kept it whatever the clock rules did
  // and both tests passed against a version with no clock handling at all.
  it('keeps future-dated snapshots rather than adjudicating the clock', () => {
    // Two of them in the same hour: without the guard the newer would claim that hour's bucket
    // and the older would be dropped as a duplicate of a bucket it never belonged in.
    const entries = [
      at(1, -5 * DAY),
      at(2, -5 * DAY - 60_000),
      at(3, 6 * HOUR),
      at(4, 5 * HOUR),
      at(5, 4 * HOUR),
      at(6, 3 * HOUR),
      at(7, 2 * HOUR),
      at(8, 0),
    ]
    const kept = planRetention(entries, NOW).keep.map((e) => e.rev)
    expect(kept).toContain(1)
    expect(kept).toContain(2)
  })

  it('keeps a snapshot whose date will not parse', () => {
    const broken = { rev: 1, takenAt: 'not a date', checksum: 'c1', count: 1 }
    const entries = [broken, at(2, 6 * HOUR), at(3, 5 * HOUR), at(4, 4 * HOUR), at(5, 3 * HOUR), at(6, 0)]
    expect(planRetention(entries, NOW).keep.map((e) => e.rev)).toContain(1)
  })

  it('drops nothing when there is nothing to drop', () => {
    expect(planRetention([], NOW)).toEqual({ keep: [], drop: [] })
  })
})

describe('takeSnapshot', () => {
  beforeEach(() => {
    installStorage()
  })

  it('writes the first snapshot and can read it back', async () => {
    const macros = [macro('a'), macro('b')]
    const meta = await takeSnapshot(macros)
    expect(meta).not.toBeNull()
    expect(meta?.rev).toBe(1)
    expect(meta?.count).toBe(2)
    expect(await readSnapshot(1)).toEqual(macros)
  })

  it('skips a library identical to the newest snapshot', async () => {
    const macros = [macro('a')]
    await takeSnapshot(macros)
    expect(await takeSnapshot(macros)).toBeNull()
    expect(await listSnapshots()).toHaveLength(1)
  })

  it('writes again once the library actually changes', async () => {
    await takeSnapshot([macro('a')])
    const second = await takeSnapshot([macro('a'), macro('b')])
    expect(second?.rev).toBe(2)
    expect((await listSnapshots()).map((s) => s.rev)).toEqual([2, 1])
  })

  it('writes a duplicate when forced, which is what a pre-restore snapshot needs', async () => {
    // The one write that must never be coalesced away: the library is about to be replaced, and
    // whether it happens to match the last snapshot is beside the point.
    const macros = [macro('a')]
    await takeSnapshot(macros)
    const forced = await takeSnapshot(macros, { force: true })
    expect(forced?.rev).toBe(2)
    expect(await listSnapshots()).toHaveLength(2)
  })

  it('keeps revisions increasing even after older snapshots are pruned', async () => {
    for (let i = 0; i < 8; i++) await takeSnapshot([macro('a', `v${i}`)])
    const snapshots = await listSnapshots()
    expect(snapshots[0].rev).toBe(8)
    // Five recent slots, and everything else fell in the same hour bucket.
    expect(snapshots).toHaveLength(5)
  })

  it('removes the payloads of pruned snapshots rather than orphaning them', async () => {
    const { area } = installStorage()
    for (let i = 0; i < 8; i++) await takeSnapshot([macro('a', `v${i}`)])
    const payloadKeys = [...area.keys()].filter((key) => key.startsWith('macro-snapshot:'))
    expect(payloadKeys.sort()).toEqual(
      [
        'macro-snapshot:4',
        'macro-snapshot:5',
        'macro-snapshot:6',
        'macro-snapshot:7',
        'macro-snapshot:8',
      ].sort()
    )
  })

  it('never leaves an index entry without its payload', async () => {
    const { area } = installStorage()
    for (let i = 0; i < 8; i++) await takeSnapshot([macro('a', `v${i}`)])
    for (const entry of await listSnapshots()) {
      expect(area.has(`macro-snapshot:${entry.rev}`)).toBe(true)
    }
  })

  it('snapshots an empty library, which is exactly when a backup matters most', async () => {
    await takeSnapshot([macro('a')])
    const emptied = await takeSnapshot([])
    expect(emptied?.count).toBe(0)
    expect(await readSnapshot(emptied!.rev)).toEqual([])
  })
})

describe('reading snapshots', () => {
  beforeEach(() => {
    installStorage()
  })

  it('returns null for a revision that is not there', async () => {
    expect(await readSnapshot(99)).toBeNull()
  })

  it('returns an empty list before anything has been written', async () => {
    expect(await listSnapshots()).toEqual([])
  })

  it('returns null when a payload is there but is not a macro list', async () => {
    const { area } = installStorage()
    area.set('macro-snapshot:1', { not: 'an array' })
    expect(await readSnapshot(1)).toBeNull()
  })

  it('reports snapshots newest first even if the stored index is not ordered', async () => {
    const { area } = installStorage()
    area.set('macro-snapshots', {
      rev: 3,
      entries: [at(1, 3 * HOUR), at(3, HOUR), at(2, 2 * HOUR)],
    })
    expect((await listSnapshots()).map((s) => s.rev)).toEqual([3, 2, 1])
  })

  it('dedupes against the highest revision, not the first entry stored', async () => {
    // A misordered index would otherwise have the check compare against an older snapshot and
    // write a duplicate -- or worse, match an older one and skip a real change.
    const { area } = installStorage()
    area.set('macro-snapshots', {
      rev: 2,
      entries: [
        { rev: 1, takenAt: new Date(NOW - HOUR).toISOString(), checksum: 'stale', count: 1 },
        { rev: 2, takenAt: new Date(NOW).toISOString(), checksum: checksumMacros([macro('a')]), count: 1 },
      ],
    })
    expect(await takeSnapshot([macro('a')])).toBeNull()
  })

  it('tolerates a corrupt index rather than throwing', async () => {
    const { area } = installStorage()
    area.set('macro-snapshots', { rev: 3, entries: 'not an array' })
    expect(await listSnapshots()).toEqual([])
    // And recovers: the next snapshot starts a fresh index.
    expect((await takeSnapshot([macro('a')]))?.rev).toBe(1)
  })
})
