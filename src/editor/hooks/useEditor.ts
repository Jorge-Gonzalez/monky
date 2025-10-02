import { useState } from 'react'
import { Macro } from '../../types'

export function useEditor() {
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null)

  const handleEdit = (macro: Macro) => setEditingMacro(macro)
  const handleDone = () => setEditingMacro(null)

  return { editingMacro, handleEdit, handleDone }
}

