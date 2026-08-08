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

export function serializeMacros(macros: Macro[]): string {
  const out: ExportedMacro[] = macros
    .filter((m) => !m.isSystemMacro)
    .map(({ id: _id, isSystemMacro: _s, isParametric: _p, ...rest }) => rest)
  return JSON.stringify(out, null, 2)
}

export function parseMacroImport(json: string): ImportedMacro[] {
  const parsed: unknown = JSON.parse(json)
  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array')
  return parsed.filter(
    (item): item is ImportedMacro =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).command === 'string' &&
      typeof (item as Record<string, unknown>).text === 'string'
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
