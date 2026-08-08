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
import type { Config, Macro } from '../types'

/**
 * The shape this version writes.
 *
 * Recorded in every envelope so a copy made by a *later* version is refused rather than
 * misinterpreted. ADR 0001 records that a `keepPrevious` checkpoint must be taken before any
 * migration runs.
 *
 * **2** — the payload may be `{ macros, config }` rather than a bare array. The bump matters more
 * than the shape does: an older build meeting the object form would find "not an array", call it
 * malformed, and fall back to the previous generation as though the copy were damaged. With the
 * version recorded it says `too-new` instead, which is true and actionable.
 */
export const LIBRARY_SCHEMA = 2

/** What a copy holds. `config` is absent in every copy written before schema 2. */
export type LibraryPayload = { macros: Macro[]; config?: Partial<Config> }

/**
 * The envelope, serialized. The one place that decides what a copy's bytes are.
 *
 * Every writer goes through here, and that is load-bearing rather than tidy. The browser-account
 * backup and the local previous states each checksum what they store, and the recovery list decides
 * that two sources hold the same library by comparing those checksums. Two call sites building the
 * object literal themselves would agree until one of them changed a key order, and the symptom
 * would be the same library listed twice with no clue why.
 */
export function serializeLibrary({ macros, config }: LibraryPayload): string {
  return JSON.stringify({ macros, config })
}

export type LibraryCheck =
  | { status: 'valid'; macros: Macro[]; config?: Partial<Config> }
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

  // Two shapes, told apart structurally rather than by the version number. A bare array is every
  // copy written before schema 2; the schema is what stops a *newer* shape being guessed at, and
  // reading the shape that is actually there is more robust than trusting a field to describe it.
  const envelope = Array.isArray(value) ? { macros: value } : (value as { macros?: unknown; config?: unknown })
  if (envelope === null || typeof envelope !== 'object' || !Array.isArray(envelope.macros)) {
    return { status: 'malformed', why: 'not a macro library' }
  }

  const seen = new Set<string>()
  for (const [index, entry] of envelope.macros.entries()) {
    if (!isMacro(entry)) {
      return { status: 'malformed', why: `entry ${String(index)} is not a macro` }
    }
    const id = String(entry.id)
    if (seen.has(id)) return { status: 'malformed', why: `duplicate id ${id}` }
    seen.add(id)
  }
  return { status: 'valid', macros: envelope.macros as Macro[], config: readConfig(envelope.config) }
}

/**
 * Preferences, taken loosely on purpose.
 *
 * A malformed *macro* makes a library unusable, so it is rejected. A malformed preference does not:
 * the store merges whatever arrives over its defaults, so a missing or nonsense field simply keeps
 * the default. Refusing an entire recovery because someone's theme was the wrong type would be the
 * same bad trade as refusing one over a duplicate command.
 *
 * `prefixes` is the exception worth a check of its own. It is the only preference that can leave a
 * restored library present but inert -- every macro back, none of them triggering -- so a value
 * that is not a list of non-empty strings is dropped in favour of the default rather than applied.
 */
function readConfig(value: unknown): Partial<Config> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const config = { ...(value as Partial<Config>) }
  const prefixes: unknown = config.prefixes
  const usable =
    Array.isArray(prefixes) && prefixes.length > 0 && prefixes.every((p) => typeof p === 'string' && p.length > 0)
  if ('prefixes' in config && !usable) delete config.prefixes
  return config
}
