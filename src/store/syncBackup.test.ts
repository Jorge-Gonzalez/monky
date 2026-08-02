// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Macro } from '../types'
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
    // Slot A still holds the first library verbatim: that is what makes a failed write survivable.
    expect(JSON.parse(store.area.get(chunkKey('A', 0)) as string)).toEqual(first)
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
    const result = await writeBackup(libraryOf(200, 900), 'dev-1')
    expect(result.status).toBe('too-large')
    if (result.status !== 'too-large') return
    expect(result.needed).toBeGreaterThan(SYNC_LIMITS.SLOT_BUDGET_BYTES)
    // Nothing written at all, so an over-quota library cannot leave a torn backup behind.
    expect(store.area.has('backup-manifest')).toBe(false)
  })

  it('removes chunks left over when a backup shrinks within the same slot', async () => {
    // A->B->A, where the third write is smaller than the first. Without cleanup the tail chunks of
    // that first write sit in slot A forever: restore ignores them, and the quota does not.
    await writeBackup(libraryOf(30), 'dev-1') // slot A, several chunks
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
    const tooBig = await writeBackup(libraryOf(200, 900), 'dev-1')
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
    await writeBackup(libraryOf(30), 'dev-1')
    const manifest = store.area.get('backup-manifest') as BackupManifest
    store.area.delete(chunkKey(manifest.slot, manifest.chunks - 1))
    expect((await readBackup()).status).toBe('incomplete')
  })

  it('says corrupt when a stale chunk sits beside a fresh manifest', async () => {
    // Everything present, everything parseable, and still the wrong library -- which is precisely
    // why the checksum is in the manifest rather than trusting that a complete read is a good one.
    await writeBackup(libraryOf(30), 'dev-1')
    const manifest = store.area.get('backup-manifest') as BackupManifest
    const stale = store.area.get(chunkKey(manifest.slot, 0)) as string
    store.area.set(chunkKey(manifest.slot, 0), stale.replace('/m0', '/xx'))
    expect((await readBackup()).status).toBe('corrupt')
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
