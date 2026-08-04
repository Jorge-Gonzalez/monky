// Is this actually a macro library?
//
// A checksum proves the bytes are the bytes that were written. It says nothing about whether what
// was written is usable. A payload can decode, parse, match its checksum perfectly, and still hold
// duplicate ids, a macro with no command, or a record from a future version of the app -- and
// restoring it would replace a working library with something the rest of the code cannot handle.
//
// So every route into the store passes through here: the browser-account copy, the local previous
// states, and an imported file. One validator rather than three means a shape the importer rejects
// cannot arrive through a restore instead.
import type { Macro } from '../types'

/**
 * The shape this version writes.
 *
 * Recorded in every envelope so a copy made by a *later* version is refused rather than
 * misinterpreted. There is no migration path yet because there has been no migration; when one is
 * added, this is where the version to migrate *from* comes from, and ADR 0001 records that a
 * `keepPrevious` checkpoint must be taken before it runs.
 */
export const LIBRARY_SCHEMA = 1

export type LibraryCheck =
  | { status: 'valid'; macros: Macro[] }
  /** Written by a newer version of the extension than the one reading it. */
  | { status: 'too-new'; schema: number }
  | { status: 'malformed'; why: string }

function isMacro(value: unknown): value is Macro {
  if (typeof value !== 'object' || value === null) return false
  const macro = value as Record<string, unknown>
  const idKind = typeof macro.id
  // `text` may legitimately be empty -- a macro mid-composition, or one whose content was not
  // included in a copy. Absent is a different thing from empty, and only absent is malformed.
  return (
    (idKind === 'string' || idKind === 'number') &&
    typeof macro.command === 'string' &&
    macro.command.length > 0 &&
    typeof macro.text === 'string'
  )
}

/**
 * Check a decoded payload before anything is allowed to replace the live library.
 *
 * Duplicate ids are rejected because identity is what every other operation keys on -- update and
 * delete both address a macro by id, so two records sharing one is a library where those operations
 * are undefined.
 *
 * Duplicate *commands* are deliberately tolerated. They degrade matching, which the editor already
 * surfaces and the user can fix, and refusing an entire recovery over one is the wrong trade at the
 * moment somebody is trying to get their work back.
 */
export function validateLibrary(value: unknown, schema: number = LIBRARY_SCHEMA): LibraryCheck {
  if (schema > LIBRARY_SCHEMA) return { status: 'too-new', schema }
  if (!Array.isArray(value)) return { status: 'malformed', why: 'not an array' }

  const seen = new Set<string>()
  for (const [index, entry] of value.entries()) {
    if (!isMacro(entry)) {
      return { status: 'malformed', why: `entry ${String(index)} is not a macro` }
    }
    const id = String(entry.id)
    if (seen.has(id)) return { status: 'malformed', why: `duplicate id ${id}` }
    seen.add(id)
  }
  return { status: 'valid', macros: value as Macro[] }
}
