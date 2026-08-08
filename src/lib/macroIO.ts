import type { Macro } from '../types'
import { freshId, takenIds } from './macroId'

export type ExportedMacro = Omit<Macro, 'id' | 'isSystemMacro' | 'isParametric'>

/**
 * What an import may carry.
 *
 * `id` is optional because files this app exports omit it -- an id is local bookkeeping, not
 * content. A hand-written file may supply one, and honouring it is what lets a single file produce
 * the same library on two machines instead of two libraries that merely look alike.
 */
export type ImportedMacro = ExportedMacro & { id?: Macro['id'] }

export type ImportResult = { added: number; skipped: number }

/** A file's contents: the macros, and the prefixes their commands are written against. */
export type ParsedImport = { macros: ImportedMacro[]; prefixes?: string[] }

/**
 * The export file, which is two things at once and is resolved in favour of the second.
 *
 * It is a personal archive *and* a file people send each other, and those pull in opposite
 * directions -- the archive wants everything, the shared pack wants nothing of the sender in it.
 * Rather than split it in two, the line is drawn through what the data *is*: a theme, a language
 * and a list of disabled sites are the sender's preferences and stay out, while **prefixes are not
 * a preference at all**. `/brb` is `/` plus `brb`; without the prefix the command in this file is
 * not a command. So they travel as part of the macros rather than alongside them.
 *
 * The consequence is accepted rather than hidden: an export is not a complete personal backup, and
 * restoring from one returns your macros working but your theme and language at their defaults.
 * The browser-account copy is the layer that keeps everything (§3 of the design document).
 */
export function serializeMacros(macros: Macro[], prefixes?: string[]): string {
  const out: ExportedMacro[] = macros
    .filter((m) => !m.isSystemMacro)
    .map(({ id: _id, isSystemMacro: _s, isParametric: _p, ...rest }) => rest)
  // The bare array stays a valid file, so every export ever produced still imports.
  if (prefixes === undefined) return JSON.stringify(out, null, 2)
  return JSON.stringify({ macros: out, config: { prefixes } }, null, 2)
}

export function parseMacroImport(json: string): ParsedImport {
  const parsed: unknown = JSON.parse(json)
  // Two shapes: a bare array is every file written before prefixes travelled, and hand-written
  // files are far likelier to be arrays than envelopes. Both keep working.
  const envelope = Array.isArray(parsed) ? { macros: parsed } : (parsed as { macros?: unknown; config?: unknown })
  if (envelope === null || typeof envelope !== 'object' || !Array.isArray(envelope.macros)) {
    throw new Error('Expected a JSON array of macros')
  }
  const macros = envelope.macros.filter(
    (item): item is ImportedMacro =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).command === 'string' &&
      typeof (item as Record<string, unknown>).text === 'string'
  )
  const config = envelope.config as { prefixes?: unknown } | undefined
  const prefixes = config?.prefixes
  const usable = Array.isArray(prefixes) && prefixes.every((p) => typeof p === 'string' && p.length > 0)
  return { macros, prefixes: usable ? (prefixes as string[]) : undefined }
}

/**
 * Which of a file's prefixes this library has to gain for the incoming macros to work.
 *
 * Added to, never replaced. An import *merges* -- unlike a restore, which replaces -- so taking the
 * file's prefixes wholesale would repoint the recipient's own triggers because they accepted
 * somebody's macro pack. Union instead: the sender's macros fire, the recipient's keep firing.
 *
 * Narrowed to prefixes an incoming command actually starts with, so a file cannot quietly grow the
 * list with characters nothing in it uses.
 */
export function prefixesToAdopt(file: ParsedImport, current: string[]): string[] {
  if (file.prefixes === undefined) return []
  // `startsWith` rather than the first character: a prefix is a string, and nothing stops one being
  // longer than a character.
  const commands = file.macros.map((macro) => macro.command)
  return file.prefixes.filter(
    (prefix) => !current.includes(prefix) && commands.some((command) => command.startsWith(prefix))
  )
}

/**
 * Merge imported macros into the library, by command: anything already present is left alone.
 *
 * Takes the library rather than just its commands because ids matter as much as commands here --
 * see macroId.ts for why the shape of an id is a storage decision and not an implementation detail.
 */
export function mergeImport(
  incoming: ImportedMacro[],
  existing: Macro[],
  add: (m: Macro) => { success: boolean }
): ImportResult {
  const existingCommands = new Set(existing.map((macro) => macro.command))
  const taken = takenIds(existing)
  let added = 0
  let skipped = 0
  for (const { id: supplied, ...macro } of incoming) {
    if (existingCommands.has(macro.command)) {
      skipped++
      continue
    }
    // A supplied id is honoured only while it is free. Letting one land on top of an id the library
    // already holds would produce duplicates, and duplicate ids are the one thing every restore
    // path refuses -- the library would still work until the day it was needed.
    const offered = typeof supplied === 'string' || typeof supplied === 'number' ? String(supplied) : ''
    const id = offered !== '' && !taken.has(offered) ? supplied : freshId(taken)
    taken.add(String(id))
    const result = add({ ...macro, id })
    if (result.success) added++
    else skipped++
  }
  return { added, skipped }
}
