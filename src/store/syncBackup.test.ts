// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../types'
import { decodeBackup, encodeBackup } from './backupCodec'
import { checksumMacros } from './checksum'
import {
  chunkKey,
  readBackup,
  splitIntoChunks,
  syncUsage,
  writeBackup,
  SYNC_LIMITS,
  type BackupManifest,
} from './syncBackup'

// A sync-storage stand-in with the behaviours that matter here: get honours a key or a list of
// them, set merges, remove deletes. Deliberately not modelling propagation -- the tests that care
// about a half-arrived backup construct that state directly.
function installStorage() {
  const area = new Map<string, unknown>()
  const sync = {
    get: vi.fn((keys: string | string[]) => {
      const list = Array.isArray(keys) ? keys : [keys]
      const out: Record<string, unknown> = {}
      for (const key of list) if (area.has(key)) out[key] = area.get(key)
      return Promise.resolve(out)
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.entries(items).forEach(([key, value]) => area.set(key, value))
      return Promise.resolve()
    }),
    remove: vi.fn((keys: string[] | string) => {
      ;(Array.isArray(keys) ? keys : [keys]).forEach((key) => area.delete(key))
      return Promise.resolve()
    }),
    getBytesInUse: vi.fn(() => Promise.resolve(1024)),
  }
  ;(globalThis as unknown as { chrome: unknown }).chrome = { storage: { sync } }
  return { area, sync }
}

const macro = (id: string, text = 'x'): Macro => ({
  id,
  command: `/${id}`,
  text,
  contentType: 'text/plain',
})

/** Enough macros to force `count` chunks, so the multi-chunk paths are exercised for real. */
const libraryOf = (n: number, pad = 500): Macro[] =>
  Array.from({ length: n }, (_, i) => macro(`m${String(i)}`, 'y'.repeat(pad)))

/**
 * A library gzip cannot help with, for the tests that are about size rather than content.
 *
 * Since the payload is compressed before it is measured, a fixture of repeated characters now
 * collapses to a single chunk however many macros it holds -- so the multi-chunk and over-budget
 * paths need content with real entropy or they silently stop testing anything.
 */
const noisyLibrary = (n: number, pad = 2_000): Macro[] =>
  Array.from({ length: n }, (_, index) => {
    let text = ''
    let x = index + 1
    for (let i = 0; i < pad; i++) {
      x = (x * 1103515245 + 12345) & 0x7fffffff
      text += String.fromCharCode(33 + (x % 90))
    }
    return macro(`m${String(index)}`, text)
  })

let store: ReturnType<typeof installStorage>
beforeEach(() => {
  store = installStorage()
})

describe('splitIntoChunks', () => {
  // The measurement, not the guess. A serialized library is dense with quotes and each one doubles
  // under JSON.stringify, so a chunk sized by raw length can overshoot the 8192-byte item cap by a
  // fifth -- and the write then fails on a user's machine with nothing to see.
  // Measured in UTF-8 bytes via TextEncoder, not String.length. The first version of these tests
  // used `.length`, which counts UTF-16 units -- so they asserted the very model that was wrong and
  // passed while real writes were rejected.
  const cost = (chunk: string, index: number) =>
    new TextEncoder().encode(JSON.stringify(chunk)).length + chunkKey('A', index).length

  it('keeps every chunk inside the item cap once stringified, with the key counted', () => {
    const chunks = splitIntoChunks(JSON.stringify(libraryOf(60)))
    for (const [index, chunk] of chunks.entries()) {
      expect(cost(chunk, index)).toBeLessThanOrEqual(SYNC_LIMITS.QUOTA_BYTES_PER_ITEM)
    }
  })

  it('holds under text that is nothing but quotes, which is the worst case for escaping', () => {
    const chunks = splitIntoChunks('"'.repeat(20_000))
    chunks.forEach((chunk, index) => {
      expect(cost(chunk, index)).toBeLessThanOrEqual(SYNC_LIMITS.QUOTA_BYTES_PER_ITEM)
    })
  })

  it('counts multi-byte characters as the bytes they are', () => {
    // The library this failed on was full of em dashes and bullets, three UTF-8 bytes each. Costing
    // them one apiece is how a budget that looked measured came out a fifth short.
    const chunks = splitIntoChunks('— • ñ '.repeat(4000))
    chunks.forEach((chunk, index) => {
      expect(cost(chunk, index)).toBeLessThanOrEqual(SYNC_LIMITS.QUOTA_BYTES_PER_ITEM)
    })
  })

  it('rejoins to exactly what it was given', () => {
    const text = JSON.stringify(libraryOf(40))
    expect(splitIntoChunks(text).join('')).toBe(text)
  })

  it('never cuts between the halves of a surrogate pair', () => {
    // An emoji is two code units. Split them across chunks and each side carries a lone surrogate,
    // which does not survive the round trip -- so the library comes back with mangled text rather
    // than failing loudly.
    const text = '😀'.repeat(4000)
    const chunks = splitIntoChunks(text, 200)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk).toBe(JSON.parse(JSON.stringify(chunk)))
      expect([...chunk].every((ch) => ch === '😀')).toBe(true)
    }
    expect(chunks.join('')).toBe(text)
  })

  it('sizes the budget from the platform cap rather than a guess', () => {
    // Measured in Chrome by binary search on a scratch key: 8,180 bytes fit under a 10-character
    // key, which is exactly 8192 - 10 - 2. The documented rule is right and the overhead is just the
    // two quotes JSON.stringify puts round a string, so the budget is derived from the cap and only
    // the margin is chosen.
    expect(SYNC_LIMITS.CHUNK_CONTENT_BUDGET).toBe(
      SYNC_LIMITS.QUOTA_BYTES_PER_ITEM - SYNC_LIMITS.MAX_CHUNK_KEY_LENGTH - 2 - 64
    )
  })

  it('never produces a key longer than the length the budget was derived from', () => {
    // The budget subtracts MAX_CHUNK_KEY_LENGTH once. If a key could exceed it the arithmetic would
    // be wrong in the one direction that costs a rejected write.
    for (let index = 0; index < SYNC_LIMITS.MAX_CHUNK_KEYS; index++) {
      expect(chunkKey('A', index).length).toBeLessThanOrEqual(SYNC_LIMITS.MAX_CHUNK_KEY_LENGTH)
    }
  })

  it('returns one empty chunk for empty text rather than nothing at all', () => {
    // A library emptied to zero macros still has to be backed up; zero chunks would read back as
    // "no backup" and quietly resurrect the macros the user deleted.
    expect(splitIntoChunks('')).toEqual([''])
  })
})

describe('writeBackup', () => {
  it('writes chunks and a manifest, and reads back what went in', async () => {
    const macros = libraryOf(3)
    const written = await writeBackup(macros, 'dev-1')
    expect(written.status).toBe('written')

    const read = await readBackup()
    expect(read.status).toBe('read')
    if (read.status !== 'read') return
    expect(read.macros).toEqual(macros)
  })

  it('starts in slot A and alternates, so a write never touches the readable copy', async () => {
    await writeBackup(libraryOf(2), 'dev-1')
    expect((store.area.get('backup-manifest') as BackupManifest).slot).toBe('A')
    await writeBackup(libraryOf(3), 'dev-1')
    expect((store.area.get('backup-manifest') as BackupManifest).slot).toBe('B')
    await writeBackup(libraryOf(4), 'dev-1')
    expect((store.area.get('backup-manifest') as BackupManifest).slot).toBe('A')
  })

  it('leaves the previous slot intact after a new write', async () => {
    const first = libraryOf(2)
    await writeBackup(first, 'dev-1')
    await writeBackup(libraryOf(3), 'dev-1')
    // Slot A still holds the first library: that is what makes a failed write survivable.
    const stillThere = await decodeBackup(store.area.get(chunkKey('A', 0)) as string)
    expect(JSON.parse(stillThere)).toEqual(first)
  })

  it('advances the revision monotonically', async () => {
    await writeBackup(libraryOf(2), 'dev-1')
    await writeBackup(libraryOf(3), 'dev-1')
    expect((store.area.get('backup-manifest') as BackupManifest).rev).toBe(2)
  })

  it('skips a write whose library is already backed up', async () => {
    const macros = libraryOf(2)
    await writeBackup(macros, 'dev-1')
    store.sync.set.mockClear()
    expect((await writeBackup(macros, 'dev-1')).status).toBe('unchanged')
    expect(store.sync.set).not.toHaveBeenCalled()
  })

  it('refuses a library too large for the quota instead of half-writing it', async () => {
    const result = await writeBackup(noisyLibrary(40), 'dev-1')
    expect(result.status).toBe('too-large')
    if (result.status !== 'too-large') return
    expect(result.needed).toBeGreaterThan(SYNC_LIMITS.SLOT_BUDGET_BYTES)
    // Nothing written at all, so an over-quota library cannot leave a torn backup behind.
    expect(store.area.has('backup-manifest')).toBe(false)
  })

  it('removes chunks left over when a backup shrinks within the same slot', async () => {
    // A->B->A, where the third write is smaller than the first. Without cleanup the tail chunks of
    // that first write sit in slot A forever: restore ignores them, and the quota does not.
    await writeBackup(noisyLibrary(8), 'dev-1') // slot A, several chunks
    const grew = (store.area.get('backup-manifest') as BackupManifest).chunks
    expect(grew).toBeGreaterThan(1)
    await writeBackup(libraryOf(2), 'dev-1') // slot B
    await writeBackup(libraryOf(1), 'dev-1') // slot A again, one chunk

    const manifest = store.area.get('backup-manifest') as BackupManifest
    expect(manifest.slot).toBe('A')
    expect(manifest.chunks).toBe(1)
    for (let index = 1; index < grew; index++) {
      expect(store.area.has(chunkKey('A', index))).toBe(false)
    }
  })

  it('clears the pre-layer-2 envelope, but only once a real backup is in place', async () => {
    // That key held the only cross-device copy there was. Removing it before a complete backup
    // exists would be deleting a backup, not tidying one up.
    store.area.set('macro-storage', '{"state":{"macros":[]}}')
    const tooBig = await writeBackup(noisyLibrary(40), 'dev-1')
    expect(tooBig.status).toBe('too-large')
    expect(store.area.has('macro-storage')).toBe(true)

    await writeBackup(libraryOf(2), 'dev-1')
    expect(store.area.has('macro-storage')).toBe(false)
  })

  it('shrinks the chunks and retries when Chrome rejects the per-item cap', async () => {
    // The failure this was found by: chunks measured 7,827 and 744 UTF-8 bytes against a documented
    // 8,192 cap, and Chrome still answered `Resource::kQuotaBytesPerItem quota exceeded`. Since the
    // real accounting could not be derived from the documented one, the write adapts instead of
    // trusting a second model.
    let rejectAbove = 4_000
    store.sync.set.mockImplementation((items: Record<string, unknown>) => {
      const oversized = Object.values(items).some(
        (v) => typeof v === 'string' && new TextEncoder().encode(v).length > rejectAbove
      )
      if (oversized) return Promise.reject(new Error('Resource::kQuotaBytesPerItem quota exceeded'))
      Object.entries(items).forEach(([k, v]) => store.area.set(k, v))
      return Promise.resolve()
    })

    const macros = libraryOf(20)
    expect((await writeBackup(macros, 'dev-1')).status).toBe('written')

    rejectAbove = Number.MAX_SAFE_INTEGER
    const read = await readBackup()
    expect(read.status).toBe('read')
    if (read.status !== 'read') return
    expect(read.macros).toEqual(macros)
  })

  it('does not retry smaller for a rejection that smaller writes cannot fix', async () => {
    // A total-quota or rate-limit refusal is made worse by more, smaller writes, so it propagates
    // to the caller, where the UI can say what actually happened.
    store.sync.set.mockRejectedValue(new Error('MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded'))
    await expect(writeBackup(libraryOf(3), 'dev-1')).rejects.toThrow('MAX_WRITE_OPERATIONS_PER_MINUTE')
    expect(store.sync.set).toHaveBeenCalledTimes(1)
  })

  it('gives up rather than shrinking forever when nothing is small enough', async () => {
    store.sync.set.mockRejectedValue(new Error('Resource::kQuotaBytesPerItem quota exceeded'))
    await expect(writeBackup(libraryOf(3), 'dev-1')).rejects.toThrow('kQuotaBytesPerItem')
    // Halving from the starting budget down to the floor, and no further.
    const halvings = Math.floor(Math.log2(SYNC_LIMITS.CHUNK_CONTENT_BUDGET / SYNC_LIMITS.MIN_CHUNK_BUDGET)) + 1
    expect(store.sync.set.mock.calls.length).toBeLessThanOrEqual(halvings + 1)
  })

  it('rewrites a backup left by an older encoding even when the macros have not changed', async () => {
    // Otherwise the migration waits for the next edit, and a library that never changes again keeps
    // a plain backup forever -- so the headroom compression exists to buy never arrives for the
    // libraries closest to needing it.
    const macros = libraryOf(3)
    store.area.set(chunkKey('A', 0), JSON.stringify(macros))
    store.area.set('backup-manifest', {
      slot: 'A',
      rev: 1,
      chunks: 1,
      checksum: checksumMacros(macros),
      count: macros.length,
      takenAt: '2026-08-01T10:00:00.000Z',
      device: 'older-install',
    })

    const result = await writeBackup(macros, 'dev-1')
    expect(result.status).toBe('written')
    if (result.status !== 'written') return
    expect(result.manifest.encoding).toBe('gzip-b64')
    // And it still reads back as the same library.
    const read = await readBackup()
    expect(read.status).toBe('read')
    if (read.status !== 'read') return
    expect(read.macros).toEqual(macros)
  })

  it('restores a backup written before compression existed', async () => {
    // A manifest with no `encoding` is what earlier versions wrote, and it has to keep restoring:
    // the copy someone reaches for may well predate the version reaching for it.
    const macros = libraryOf(3)
    const plain = JSON.stringify(macros)
    store.area.set(chunkKey('A', 0), plain)
    store.area.set('backup-manifest', {
      slot: 'A',
      rev: 1,
      chunks: 1,
      checksum: checksumMacros(macros),
      count: macros.length,
      takenAt: '2026-08-01T10:00:00.000Z',
      device: 'older-install',
    })

    const read = await readBackup()
    expect(read.status).toBe('read')
    if (read.status !== 'read') return
    expect(read.macros).toEqual(macros)
  })

  it('marks what it wrote, so a later reader does not have to guess', async () => {
    await writeBackup(libraryOf(2), 'dev-1')
    expect((store.area.get('backup-manifest') as BackupManifest).encoding).toBe('gzip-b64')
  })

  it('records the device that wrote it', async () => {
    await writeBackup(libraryOf(1), 'laptop')
    expect((store.area.get('backup-manifest') as BackupManifest).device).toBe('laptop')
  })
})

describe('readBackup', () => {
  it('says none when nothing has been backed up', async () => {
    expect((await readBackup()).status).toBe('none')
  })

  it('says incomplete when the manifest arrived ahead of its chunks', async () => {
    // The case the A/B design exists for. Cross-device arrival order for a multi-key set() is
    // undocumented, so a manifest can land beside chunks that have not.
    await writeBackup(noisyLibrary(8), 'dev-1')
    const manifest = store.area.get('backup-manifest') as BackupManifest
    expect(manifest.chunks).toBeGreaterThan(1)
    store.area.delete(chunkKey(manifest.slot, manifest.chunks - 1))
    expect((await readBackup()).status).toBe('incomplete')
  })

  it('falls back to the previous generation when the live slot is corrupt', async () => {
    // The difference between detecting a problem and surviving it. Two devices backing up at once
    // can interleave chunks in the same standby slot; the checksum catches it, but a complete valid
    // generation still sits in the other slot, and without this the reader reported failure while a
    // good copy sat beside it.
    const older = libraryOf(3)
    await writeBackup(older, 'dev-1')
    const newer = libraryOf(4)
    await writeBackup(newer, 'dev-1')

    const manifest = store.area.get('backup-manifest') as BackupManifest
    store.area.set(chunkKey(manifest.slot, 0), await encodeBackup('[{"id":"junk"}]'))

    const read = await readBackup()
    expect(read.status).toBe('read')
    if (read.status !== 'read') return
    expect(read.macros).toEqual(older)
    // Described by the generation actually returned, so the list shows when *that* copy was made.
    expect(read.manifest.count).toBe(older.length)
  })

  it('does not fall back when the live slot is merely still arriving', async () => {
    // 'incomplete' means propagation is in flight. Handing back an older library the user did not
    // ask for would be worse than saying so and letting them try again.
    await writeBackup(libraryOf(3), 'dev-1')
    await writeBackup(noisyLibrary(6), 'dev-1')
    const manifest = store.area.get('backup-manifest') as BackupManifest
    expect(manifest.chunks).toBeGreaterThan(1)
    store.area.delete(chunkKey(manifest.slot, manifest.chunks - 1))
    expect((await readBackup()).status).toBe('incomplete')
  })

  it('reports corrupt when neither generation is readable', async () => {
    await writeBackup(libraryOf(3), 'dev-1')
    await writeBackup(libraryOf(4), 'dev-1')
    const manifest = store.area.get('backup-manifest') as BackupManifest
    store.area.set(chunkKey(manifest.slot, 0), await encodeBackup('[{"id":"junk"}]'))
    store.area.set(chunkKey(manifest.previous!.slot, 0), await encodeBackup('[{"id":"junk"}]'))
    expect((await readBackup()).status).toBe('corrupt')
  })

  it('has nothing to fall back to on the very first backup', async () => {
    await writeBackup(libraryOf(3), 'dev-1')
    const manifest = store.area.get('backup-manifest') as BackupManifest
    expect(manifest.previous).toBeUndefined()
    store.area.set(chunkKey(manifest.slot, 0), await encodeBackup('[{"id":"junk"}]'))
    expect((await readBackup()).status).toBe('corrupt')
  })

  it('refuses a copy written by a newer version rather than guessing at it', async () => {
    await writeBackup(libraryOf(2), 'dev-1')
    const manifest = store.area.get('backup-manifest') as BackupManifest
    store.area.set('backup-manifest', { ...manifest, schema: 99 })
    const read = await readBackup()
    expect(read.status).toBe('too-new')
    if (read.status !== 'too-new') return
    expect(read.schema).toBe(99)
  })

  it('rejects a payload that passes its checksum but is not a usable library', async () => {
    // Integrity and validity are different questions. Duplicate ids checksum perfectly well and
    // would leave update and delete addressing two records at once.
    const broken = [{ id: 'a', command: '/a', text: 'x' }, { id: 'a', command: '/b', text: 'y' }]
    await writeBackup(broken as never, 'dev-1')
    expect((await readBackup()).status).toBe('corrupt')
  })

  it('never hands back a stale chunk as though it were the current library', async () => {
    // Everything present, everything decodable, and still not the library the manifest describes --
    // which is why the checksum lives in the manifest rather than trusting that a complete read is a
    // good one.
    //
    // This used to end in `corrupt`. It now ends in a deliberate fallback: the previous generation
    // is returned *described as itself*, rather than a mixture arriving under the newer manifest's
    // name. Detecting the problem was never the goal; surviving it is.
    const older = libraryOf(3)
    await writeBackup(older, 'dev-1')
    const first = store.area.get('backup-manifest') as BackupManifest
    const staleChunk = store.area.get(chunkKey(first.slot, 0)) as string

    const newer = libraryOf(4)
    await writeBackup(newer, 'dev-1')
    const fresh = store.area.get('backup-manifest') as BackupManifest
    expect(fresh.chunks).toBe(1)
    store.area.set(chunkKey(fresh.slot, 0), staleChunk)

    const read = await readBackup()
    expect(read.status).toBe('read')
    if (read.status !== 'read') return
    expect(read.macros).not.toEqual(newer)
    expect(read.macros).toEqual(older)
    expect(read.manifest.count).toBe(older.length)
  })

  it('says corrupt rather than throwing when the chunks do not parse', async () => {
    await writeBackup(libraryOf(2), 'dev-1')
    const manifest = store.area.get('backup-manifest') as BackupManifest
    store.area.set(chunkKey(manifest.slot, 0), '{{{not json')
    expect((await readBackup()).status).toBe('corrupt')
  })

  it('round-trips an emptied library rather than reporting it as absent', async () => {
    await writeBackup([], 'dev-1')
    const read = await readBackup()
    expect(read.status).toBe('read')
    if (read.status !== 'read') return
    expect(read.macros).toEqual([])
  })

  it('round-trips text that escaping and chunking could each mangle', async () => {
    const awkward = [
      macro('quotes', '"he said \\"hi\\""'),
      macro('newlines', 'a\nb\tc\r\nd'),
      macro('unicode', '😀 ñ 中文 '),
    ]
    await writeBackup(awkward, 'dev-1')
    const read = await readBackup()
    expect(read.status).toBe('read')
    if (read.status !== 'read') return
    expect(read.macros).toEqual(awkward)
  })
})

describe('syncUsage', () => {
  it('reports usage as a fraction of the quota', async () => {
    const usage = await syncUsage()
    expect(usage.used).toBe(1024)
    expect(usage.total).toBe(SYNC_LIMITS.QUOTA_BYTES)
    expect(usage.fraction).toBeCloseTo(1024 / SYNC_LIMITS.QUOTA_BYTES)
  })
})
