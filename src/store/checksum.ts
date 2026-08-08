// A digest over the macro library, used wherever "is this the same library?" has to be answered.
//
// Its own module because three unrelated things need it -- the browser-account backup, the export
// nudge, and the restore list's de-duplication -- and it previously lived inside the snapshot
// subsystem, which meant deleting that subsystem would have taken the digest with it.
import type { Macro } from '../types'

/**
 * Cheap and stable. Not cryptographic: nothing here defends against an adversary, it only has to
 * answer whether two libraries are the same one. Length is folded in alongside the hash because two
 * texts colliding on both is far less likely than on either.
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
 * Digest and size of text that has already been serialized.
 *
 * The backup checksums through here rather than re-serializing what it parsed, and that is what
 * lets one comparison cover two envelope shapes. A reader has the decoded text in hand -- byte for
 * byte the string the writer measured -- so it can verify integrity *before* parsing and without
 * knowing whether the payload is a bare array or `{ macros, config }`.
 */
export function measureSerialized(serialized: string): { checksum: string; bytes: number } {
  return { checksum: `${serialized.length}-${fnv1a(serialized)}`, bytes: serialized.length }
}

/**
 * Digest and size in one pass, because both come from the same serialization and computing it twice
 * to learn two facts about it would be silly.
 */
export function measureMacros(macros: Macro[]): { checksum: string; bytes: number } {
  return measureSerialized(JSON.stringify(macros))
}

export function checksumMacros(macros: Macro[]): string {
  return measureMacros(macros).checksum
}
