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
 * Digest and size in one pass, because both come from the same serialization and computing it twice
 * to learn two facts about it would be silly.
 */
export function measureMacros(macros: Macro[]): { checksum: string; bytes: number } {
  const serialized = JSON.stringify(macros)
  return { checksum: `${serialized.length}-${fnv1a(serialized)}`, bytes: serialized.length }
}

export function checksumMacros(macros: Macro[]): string {
  return measureMacros(macros).checksum
}
