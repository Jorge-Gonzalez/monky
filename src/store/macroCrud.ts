import { useMacroStore } from './useMacroStore'
import { getErrorMessage } from '../lib/errors'
import { keepPrevious } from './macroPrevious'
import type { Macro } from '../types'

// Macro create/update/delete against the store, which is the only source of truth. Framework-free
// — the editor views call these directly.
//
// These used to push each change to a hosted backend as well. That backend was dropped: it was a
// complete REST client that had never been switched on, and keeping it made every mutation path
// look as though it had a remote half. `updated_at` outlives it, because "when was this last
// changed" is worth knowing whether or not anything syncs.

export type Result = { success: boolean; error?: string }

type NewMacro = Omit<Macro, 'id'>

export function createMacro(data: NewMacro): Result {
  const macro = { id: Date.now().toString(), ...data, updated_at: new Date().toISOString() } as Macro
  const result = useMacroStore.getState().addMacro(macro)
  if (!result.success) {
    return { success: false, error: getErrorMessage(result.error, macro.command) }
  }
  return { success: true }
}

export function updateMacro(id: string, data: Partial<Macro>): Result {
  const patch = { ...data, updated_at: new Date().toISOString() }
  const result = useMacroStore.getState().updateMacro(id, patch)
  if (!result.success) {
    return { success: false, error: getErrorMessage(result.error, data.command || '') }
  }
  return { success: true }
}

// Takes an array because deleting a selection is one action, not a run of them. Looping a
// single-id delete from the UI would make the caller decompose the user's intent and then own what
// a partial loop means; here it is one filter pass, one notification, and no render showing the
// list half-deleted.
export function deleteMacros(ids: string[]): Result {
  if (ids.length === 0) return { success: true }
  const before = useMacroStore.getState().macros
  // Keep the library as it stands, because this is the operation that whole-library recovery exists
  // for: a selection deleted by accident, discovered when a macro fails to expand weeks later.
  //
  // Not awaited, and the array is captured first: the delete must not wait on a storage write, and
  // what gets kept has to be the state from before it either way.
  void keepPrevious(before, 'delete').catch((error: unknown) => {
    console.warn('[MONKY] could not keep the previous library before deleting:', error)
  })
  useMacroStore.getState().deleteMacros(ids)
  return { success: true }
}
