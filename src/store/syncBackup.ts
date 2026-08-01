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
 * How much of an item a chunk's *content* may claim.
 *
 * The quota counts the key's length plus the JSON stringification of the value, so the budget has
 * to leave room for the key, the two surrounding quotes, and whatever escaping costs. Escaping is
 * measured exactly below rather than guessed at, so this margin only covers the key and the quotes,
 * with room to spare.
 */
const CHUNK_CONTENT_BUDGET = 7_800

/**
 * Two slots share one 102,400-byte quota, so a slot gets about 50 KB and no more than six chunks
 * fit in it. Past that the write would succeed into a quota it cannot afford to keep, so it is
 * refused with a reason the UI can show instead.
 */
const MAX_CHUNKS = 6

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
}

// Discriminated on a string rather than a boolean `ok`, which is not a style preference: this
// project does not enable `strictNullChecks`, and without it TypeScript will not narrow a union on
// a boolean discriminant -- `if (!result.ok)` leaves `result.reason` a type error. String
// discriminants narrow either way, so the results stay checkable without a project-wide tsconfig
// change. It also reads better at the call site, where 'incomplete' says more than `!ok`.

export type BackupWriteResult =
  | { status: 'written'; manifest: BackupManifest }
  | { status: 'unchanged' }
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
function jsonCost(code: number): number {
  if (code === 0x22 || code === 0x5c) return 2 // " and \
  if (code === 0x08 || code === 0x09 || code === 0x0a || code === 0x0c || code === 0x0d) return 2
  if (code < 0x20) return 6 // \u00XX
  // A lone surrogate is escaped as \uXXXX; a paired one is not. Charging both the escaped price
  // over-estimates a pair by ten, which the budget can afford and which cannot fail a write.
  if (code >= 0xd800 && code <= 0xdfff) return 6
  return 1
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
    const next = jsonCost(code)
    // Never cut between the halves of a surrogate pair: the two chunks would each carry a lone
    // surrogate, and the text would not survive being put back together.
    const splitsPair =
      code >= 0xdc00 && code <= 0xdfff && index > start && text.charCodeAt(index - 1) >= 0xd800 && text.charCodeAt(index - 1) <= 0xdbff
    if (cost + next > budget && !splitsPair) {
      chunks.push(text.slice(start, index))
      start = index
      cost = 0
    }
    cost += next
  }
  chunks.push(text.slice(start))
  return chunks
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

  const chunks = splitIntoChunks(serialized)
  if (chunks.length > MAX_CHUNKS) return { status: 'too-large', needed: chunks.length }

  const slot = standbySlot(manifest)
  const next: BackupManifest = {
    slot,
    rev: (manifest?.rev ?? 0) + 1,
    chunks: chunks.length,
    checksum,
    count: macros.length,
    takenAt: new Date().toISOString(),
    device,
  }

  // Chunks first and the manifest second, in two calls. On this device that ordering means the
  // manifest never names chunks that were not written. It cannot impose an order on a device
  // receiving them, which is what the standby slot and the checksum are for.
  await chrome.storage.sync.set(Object.fromEntries(chunks.map((c, i) => [chunkKey(slot, i), c])))
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
  for (let index = chunks.length; index < MAX_CHUNKS; index++) tail.push(chunkKey(slot, index))
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

  const serialized = (parts as string[]).join('')
  let macros: unknown
  try {
    macros = JSON.parse(serialized) as unknown
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

export const SYNC_LIMITS = { QUOTA_BYTES, QUOTA_BYTES_PER_ITEM, MAX_CHUNKS, CHUNK_CONTENT_BUDGET }
