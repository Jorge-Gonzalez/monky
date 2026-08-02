// Layer 2 -- the backup that survives a reinstall.
//
// Local snapshots protect against the user's own mistakes and die with the profile. This is the
// other failure: the machine is gone, the extension is reinstalled, and the macros should come
// back without anyone having remembered to do anything. `chrome.storage.sync` is the only place
// that offers that without an account, and it is a hostile substrate for it -- so the shape of
// this file is almost entirely a response to three of its properties.
//
// It caps an item at 8192 bytes, which is why the library is split into chunks. It gives no
// history, so a failed write must not be able to damage the readable copy -- hence two alternating
// slots, with the manifest naming the live one and every write going to the *other* one. And the
// arrival order of a multi-key `set()` on a receiving device is undocumented, which was researched
// and could not be settled either way: a stale chunk from two cycles ago can sit beside a fresh
// manifest. The checksum is what makes that detectable rather than silently wrong, and it is why
// this design is correct whichever way the undocumented behaviour falls.
//
// Restore stays explicit. Overwriting a library is exactly the kind of thing a user should be
// present for, and it is the one moment two devices' libraries meet.
import type { Macro } from '../types'
import { measureMacros } from './macroSnapshots'
import { decodeWith, encodeBackup, type BackupEncoding } from './backupCodec'

const MANIFEST_KEY = 'backup-manifest'

/**
 * The pre-layer-2 copy: the store's whole persisted envelope under its own key, written by the
 * persist adapter on every change until it outgrew the 8192-byte item cap and began rejecting every
 * time. It is dead weight now -- nothing reads it, it cannot be updated, and on a real profile it
 * was holding 26 stale macros in ~7.4 KB, which was the entire browser-account quota the settings
 * readout reported.
 *
 * Removed only after a complete backup has been written, never before. Until that moment it is the
 * only cross-device copy there is, and however stale a copy may be, deleting the sole one is not a
 * cleanup.
 */
const LEGACY_KEY = 'macro-storage'

/** `chrome.storage.sync` limits, named rather than sprinkled as numbers. */
const QUOTA_BYTES = 102_400
const QUOTA_BYTES_PER_ITEM = 8_192

/**
 * How much of an item a chunk's *content* may claim, as a starting guess rather than a fact.
 *
 * The documented rule is "the JSON stringification of its value plus its key length", and an
 * earlier version of this file budgeted against a careful model of exactly that: escaping measured
 * per character, 7,800 bytes of content, key and quotes covered by the margin. It produced chunks
 * of 7,827 and 744 UTF-8 bytes against a documented cap of 8,192 -- and Chrome rejected the write
 * with `Resource::kQuotaBytesPerItem quota exceeded`.
 *
 * So the real accounting is stricter than the documented one in some way this code could not
 * derive. Rather than guess at a second model and find out the same way, the write below adapts:
 * it starts here and halves on a per-item rejection until it fits. Being wrong is then a retry
 * instead of a backup that never happens.
 */
const CHUNK_CONTENT_BUDGET = 6_000

/** Below this the chunk count stops being worth the write operations; give up and report instead. */
const MIN_CHUNK_BUDGET = 750

/**
 * Two slots share the 102,400-byte total, and the manifest and edit log need room beside them, so a
 * slot gets roughly 45 KB. Checked against the serialized size directly rather than against a chunk
 * count, because the chunk count now varies with whatever budget the write settled on.
 */
const SLOT_BUDGET_BYTES = 45_000

/**
 * How far the stale-chunk sweep reaches. Generous, because it costs one `remove` of absent keys and
 * the alternative is tracking a second slot's length through the manifest.
 */
const MAX_CHUNK_KEYS = 64

export type Slot = 'A' | 'B'

export interface BackupManifest {
  /** Which slot holds the chunks this manifest describes. */
  slot: Slot
  /** Monotonic. Plain, because a text expander is not edited from two devices at once. */
  rev: number
  chunks: number
  /** Of the serialized library, so a torn or partly-propagated read is detected rather than used. */
  checksum: string
  /** Macro count, so the UI can describe the backup without reassembling it. */
  count: number
  takenAt: string
  device: string
  /**
   * How the chunks were written. Absent on backups made before compression, which is exactly why a
   * reader must consult it rather than assume -- the copy someone restores may well predate the
   * version restoring it.
   */
  encoding?: BackupEncoding
}

// Discriminated on a string rather than a boolean `ok`, which is not a style preference: this
// project does not enable `strictNullChecks`, and without it TypeScript will not narrow a union on
// a boolean discriminant -- `if (!result.ok)` leaves `result.reason` a type error. String
// discriminants narrow either way, so the results stay checkable without a project-wide tsconfig
// change. It also reads better at the call site, where 'incomplete' says more than `!ok`.

export type BackupWriteResult =
  | { status: 'written'; manifest: BackupManifest }
  | { status: 'unchanged' }
  /** `needed` is the serialized size in bytes, against SLOT_BUDGET_BYTES. */
  | { status: 'too-large'; needed: number }

export type BackupReadResult =
  | { status: 'read'; macros: Macro[]; manifest: BackupManifest }
  | { status: 'none' }
  | { status: 'incomplete' }
  | { status: 'corrupt' }

export const chunkKey = (slot: Slot, index: number) => `backup${slot}:${index}`

/**
 * What one character costs once JSON.stringify has had it.
 *
 * Measured rather than estimated because the difference is not small: a serialized macro library is
 * dense with quotes, each of which doubles, so a "roughly 8 KB" guess can overshoot the item cap by
 * a fifth and fail the write with no way to see why.
 */
function jsonCost(code: number, pairedSurrogate: boolean): number {
  if (code === 0x22 || code === 0x5c) return 2 // \" and \\, both ASCII
  if (code === 0x08 || code === 0x09 || code === 0x0a || code === 0x0c || code === 0x0d) return 2
  if (code < 0x20) return 6 // \u00XX
  if (code < 0x80) return 1
  // UTF-8, not UTF-16 units. An em dash costs three bytes and a bullet three, and this library is
  // full of both -- counting them as one each is how a "measured" budget silently under-counts.
  if (code < 0x800) return 2
  // A surrogate pair encodes one code point in four bytes, so two per half. A lone surrogate is
  // escaped to \uXXXX, which is six ASCII bytes.
  if (code >= 0xd800 && code <= 0xdfff) return pairedSurrogate ? 2 : 6
  return 3
}

/**
 * Split serialized text so that every piece fits an item once stringified.
 *
 * Exported because it is the part most likely to be wrong and the part whose wrongness only shows
 * up as a rejected write on somebody else's machine.
 */
export function splitIntoChunks(text: string, budget: number = CHUNK_CONTENT_BUDGET): string[] {
  if (text.length === 0) return ['']
  const chunks: string[] = []
  let start = 0
  let cost = 0
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index)
    const isLow = code >= 0xdc00 && code <= 0xdfff
    const previous = index > 0 ? text.charCodeAt(index - 1) : 0
    const isHigh = code >= 0xd800 && code <= 0xdbff
    const next = text.length > index + 1 ? text.charCodeAt(index + 1) : 0
    const paired =
      (isHigh && next >= 0xdc00 && next <= 0xdfff) || (isLow && previous >= 0xd800 && previous <= 0xdbff)
    // Never cut between the halves of a surrogate pair: the two chunks would each carry a lone
    // surrogate, and the text would not survive being put back together.
    const splitsPair = isLow && index > start && previous >= 0xd800 && previous <= 0xdbff
    const charCost = jsonCost(code, paired)
    if (cost + charCost > budget && !splitsPair) {
      chunks.push(text.slice(start, index))
      start = index
      cost = 0
    }
    cost += charCost
  }
  chunks.push(text.slice(start))
  return chunks
}

/** UTF-8 length, which is what a storage quota counts and what `String.length` is not. */
const byteLength = (text: string): number => new TextEncoder().encode(text).length

/** Whether a rejection is the per-item cap specifically, as opposed to the total or a rate limit. */
function isPerItemQuotaError(error: unknown): boolean {
  // Read off the value rather than through String(), which answers "[object Object]" for the plain
  // objects chrome.* rejects with in places -- and would then match nothing, turning an adaptable
  // failure back into a permanent one.
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error)
  return message.toLowerCase().includes('quotabytesperitem')
}

async function readManifest(): Promise<BackupManifest | null> {
  const stored = await chrome.storage.sync.get(MANIFEST_KEY)
  const manifest = stored[MANIFEST_KEY] as BackupManifest | undefined
  if (!manifest || typeof manifest.rev !== 'number' || (manifest.slot !== 'A' && manifest.slot !== 'B')) {
    return null
  }
  return manifest
}

/** The slot to write next: always the one that is not live, so a failure cannot reach the good copy. */
const standbySlot = (manifest: BackupManifest | null): Slot =>
  manifest === null || manifest.slot === 'B' ? 'A' : 'B'

/**
 * Copy the library to the browser account.
 *
 * Skips a write whose checksum matches what is already backed up, which makes calling this on every
 * change cheap and keeps the write quota irrelevant rather than merely survivable.
 */
export async function writeBackup(macros: Macro[], device: string): Promise<BackupWriteResult> {
  const serialized = JSON.stringify(macros)
  const { checksum } = measureMacros(macros)
  const manifest = await readManifest()
  if (manifest?.checksum === checksum) return { status: 'unchanged' }

  // Compressed first, then measured: the budget applies to what is actually stored, so the ceiling
  // is the compressed one. On a library of email templates -- text and html held side by side, each
  // a near-duplicate of the other -- that is the difference between roughly 38 macros and several
  // hundred.
  const payload = await encodeBackup(serialized)
  const size = byteLength(payload)
  if (size > SLOT_BUDGET_BYTES) return { status: 'too-large', needed: size }

  const slot = standbySlot(manifest)

  // Write the chunks, shrinking the budget until Chrome accepts them.
  //
  // Retrying is safe precisely because of the standby slot: everything here lands in the copy that
  // is *not* live, and the manifest still points at the previous one, so a half-written attempt
  // damages nothing and the next attempt simply overwrites it.
  let budget = CHUNK_CONTENT_BUDGET
  let chunks: string[] = []
  for (;;) {
    chunks = splitIntoChunks(payload, budget)
    try {
      await chrome.storage.sync.set(Object.fromEntries(chunks.map((c, i) => [chunkKey(slot, i), c])))
      break
    } catch (error: unknown) {
      // Only the per-item cap is worth retrying smaller. A total-quota or rate-limit rejection will
      // not be helped by more, smaller writes -- it would be made worse by them.
      if (!isPerItemQuotaError(error) || budget <= MIN_CHUNK_BUDGET) throw error
      budget = Math.floor(budget / 2)
    }
  }

  const next: BackupManifest = {
    slot,
    rev: (manifest?.rev ?? 0) + 1,
    chunks: chunks.length,
    checksum,
    count: macros.length,
    takenAt: new Date().toISOString(),
    device,
    encoding: 'gzip-b64',
  }

  // The manifest second, in its own call. On this device that ordering means the manifest never
  // names chunks that were not written. It cannot impose an order on a device receiving them, which
  // is what the standby slot and the checksum are for.
  await chrome.storage.sync.set({ [MANIFEST_KEY]: next })

  // Chunks left in this slot by an earlier, larger backup. Restore already ignores them -- the
  // manifest says how many to read -- but they sit in the quota unseen and unspendable.
  //
  // The obvious guard is wrong and worth naming: comparing against `manifest.chunks` never fires,
  // because the manifest read above describes the slot we are *not* writing. This slot was last
  // written two cycles ago and nothing records how long it was then. Rather than track a second
  // length, clear the whole tail a slot could possibly hold -- `remove` on absent keys is a no-op
  // and MAX_CHUNKS bounds the list to a handful.
  //
  // After the manifest, deliberately: an orphaned chunk costs space, whereas a chunk removed before
  // the manifest stopped pointing at it costs the backup.
  const tail: string[] = []
  for (let index = chunks.length; index < MAX_CHUNK_KEYS; index++) tail.push(chunkKey(slot, index))
  if (tail.length > 0) await chrome.storage.sync.remove(tail)

  // Safe here and nowhere earlier: a complete, checksummed backup now exists in this same storage
  // area, so the stale envelope is genuinely redundant rather than merely old.
  await chrome.storage.sync.remove(LEGACY_KEY)

  return { status: 'written', manifest: next }
}

/** Read back whatever the manifest currently points at, or say precisely why it could not. */
export async function readBackup(): Promise<BackupReadResult> {
  const manifest = await readManifest()
  if (manifest === null) return { status: 'none' }

  const keys = Array.from({ length: manifest.chunks }, (_, index) => chunkKey(manifest.slot, index))
  const stored = await chrome.storage.sync.get(keys)
  const parts = keys.map((key): unknown => stored[key])
  // A missing chunk is the half-arrived case: the manifest reached this device before all of the
  // data it describes. Saying so is not the same as saying the backup is broken, and the user is
  // owed the difference -- one is worth retrying, the other is not.
  if (parts.some((part) => typeof part !== 'string')) return { status: 'incomplete' }

  let macros: unknown
  try {
    // Decoding and parsing share an outcome on purpose. From the reader's side "the bytes did not
    // decompress" and "the text was not JSON" are the same fact: something is there and it is not
    // the library.
    macros = JSON.parse(await decodeWith((parts as string[]).join(''), manifest.encoding)) as unknown
  } catch {
    return { status: 'corrupt' }
  }
  if (!Array.isArray(macros)) return { status: 'corrupt' }
  // The guard the whole A/B design exists to make possible: a stale chunk beside a fresh manifest
  // parses perfectly well and is still the wrong library.
  if (measureMacros(macros as Macro[]).checksum !== manifest.checksum) {
    return { status: 'corrupt' }
  }
  return { status: 'read', macros: macros as Macro[], manifest }
}

/** What the manifest says, without reassembling the library. For the UI's "last backed up" line. */
export async function backupStatus(): Promise<BackupManifest | null> {
  return readManifest()
}

export interface SyncUsage {
  used: number
  total: number
  /** 0..1, for a meter that should not have to do its own arithmetic. */
  fraction: number
}

/**
 * How much of the browser account's quota this extension is using.
 *
 * Worth surfacing rather than inferring: the ceiling is the reason to know or not know whether
 * compression is ever warranted, and guessing at a number the platform will simply report is how
 * an optimisation gets built for nobody.
 */
export async function syncUsage(): Promise<SyncUsage> {
  const used = await chrome.storage.sync.getBytesInUse(null)
  return { used, total: QUOTA_BYTES, fraction: Math.min(1, used / QUOTA_BYTES) }
}

export const SYNC_LIMITS = {
  QUOTA_BYTES,
  QUOTA_BYTES_PER_ITEM,
  SLOT_BUDGET_BYTES,
  CHUNK_CONTENT_BUDGET,
  MIN_CHUNK_BUDGET,
  MAX_CHUNK_KEYS,
}
