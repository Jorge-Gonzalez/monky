// Pattern: Store-Hook — the editor feature. Macros live in the store; CRUD lives
// in store/macroCrud. The only view-local state is which macro is being edited.
import { useState, useCallback } from 'react'
import type { Macro } from '../types'

export function useMacroEditor(initial: Macro | null = null) {
  const [editingMacro, setEditingMacro] = useState<Macro | null>(initial)
  const resetForm = useCallback(() => setEditingMacro(null), [])
  return { editingMacro, setEditingMacro, resetForm }
}
