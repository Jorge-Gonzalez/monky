import type { Macro } from '../types'

export type ExportedMacro = Omit<Macro, 'id' | 'isSystemMacro' | 'isParametric'>

export type ImportResult = { added: number; skipped: number }

export function serializeMacros(macros: Macro[]): string {
  const out: ExportedMacro[] = macros
    .filter((m) => !m.isSystemMacro)
    .map(({ id: _id, isSystemMacro: _s, isParametric: _p, ...rest }) => rest)
  return JSON.stringify(out, null, 2)
}

export function parseMacroImport(json: string): ExportedMacro[] {
  const parsed: unknown = JSON.parse(json)
  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array')
  return parsed.filter(
    (item): item is ExportedMacro =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).command === 'string' &&
      typeof (item as Record<string, unknown>).text === 'string'
  )
}

export function mergeImport(
  incoming: ExportedMacro[],
  existingCommands: Set<string>,
  add: (m: Macro) => { success: boolean }
): ImportResult {
  let added = 0
  let skipped = 0
  for (const m of incoming) {
    if (existingCommands.has(m.command)) {
      skipped++
      continue
    }
    const result = add({ ...m, id: crypto.randomUUID() })
    if (result.success) added++
    else skipped++
  }
  return { added, skipped }
}
