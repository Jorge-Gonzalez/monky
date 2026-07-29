import { useMacroStore } from './useMacroStore'
import { pushCreate, pushUpdate, pushDelete } from '../lib/sync'
import { getErrorMessage } from '../lib/errors'
import type { Macro } from '../types'

// Macro create/update/delete operations: the store is the local source of truth
// (write + dup-check), then lib/sync pushes the change to the backend. Framework-
// free — the editor views call these directly.

export type Result = { success: boolean; error?: string }

type NewMacro = Omit<Macro, 'id'>

export async function createMacro(data: NewMacro): Promise<Result> {
  const macro = { id: Date.now().toString(), ...data, updated_at: new Date().toISOString() } as Macro
  const result = useMacroStore.getState().addMacro(macro)
  if (!result.success) {
    return { success: false, error: getErrorMessage(result.error, macro.command) }
  }
  await pushCreate(macro)
  return { success: true }
}

export async function updateMacro(id: string, data: Partial<Macro>): Promise<Result> {
  const patch = { ...data, updated_at: new Date().toISOString() }
  const result = useMacroStore.getState().updateMacro(id, patch)
  if (!result.success) {
    return { success: false, error: getErrorMessage(result.error, data.command || '') }
  }
  await pushUpdate({ id, ...patch })
  return { success: true }
}

// Takes an array because deleting a selection is one action, not a run of them. Looping a
// single-id delete from the UI would make the caller decompose the user's intent and then own
// what a partial loop means; here the local write is atomic and the pushes fan out from it.
// The backend has no bulk endpoint (`DELETE /macros/:id`), so the network side is still one
// request per id -- but in parallel rather than serialised behind each other's awaits.
export async function deleteMacros(ids: string[]): Promise<Result> {
  if (ids.length === 0) return { success: true }
  useMacroStore.getState().deleteMacros(ids)
  await Promise.all(ids.map((id) => pushDelete(id)))
  return { success: true }
}
