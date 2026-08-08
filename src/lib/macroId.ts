// Macro ids are opaque to everything that reads them: nothing sorts by id, parses it, or derives
// meaning from it. Their *shape* is still a storage decision, because every id is written into the
// browser-account backup and charged against a 102,400-byte quota.
//
// This exists because two paths had grown two different answers. Creating a macro by hand used
// `Date.now().toString()`; importing used `crypto.randomUUID()`. Measured against a real library
// held in both browsers, the imported copy's chunk was ~245 bytes larger per slot despite holding
// *fewer* macros and less text. A UUID is ~122 bits of entropy, which is precisely the input gzip
// can do nothing with, while consecutive timestamps share nearly every character. An imported
// library therefore paid roughly 9% more quota than the same macros typed by hand -- permanently,
// and for nothing.
//
// Timestamps alone were not the answer either. Two macros minted in the same millisecond get the
// same id; `addMacro` guards duplicate *commands* only; and `validateLibrary` rejects duplicate ids
// as malformed. Those three together let the app write a library it would afterwards refuse to
// restore. So uniqueness here is by construction rather than by probability.
import type { Macro } from '../types'

/**
 * An id no macro in `taken` is using.
 *
 * Base-36 keeps it short, and the shared prefix is the point: a batch minted in one import differs
 * only in its last character or two, which is what lets it compress to almost nothing.
 */
export function freshId(taken: ReadonlySet<string>): string {
  const base = Date.now().toString(36)
  let id = base
  for (let n = 1; taken.has(id); n++) id = `${base}${n.toString(36)}`
  return id
}

/**
 * The ids already in use, in the string form `freshId` compares against.
 *
 * Stringified because `Macro['id']` is `number | string` -- the seeded macros are numbered and
 * everything since is text, so `1` and `'1'` have to collide rather than sit side by side.
 */
export function takenIds(macros: Macro[]): Set<string> {
  return new Set(macros.map((macro) => String(macro.id)))
}
