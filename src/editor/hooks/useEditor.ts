// This hook is deprecated. Use useEditorManager instead.
// This file is kept for backward compatibility during migration.
import { Macro } from '../../types'

export function useEditor() {
  return { 
    editingMacro: null, 
    handleEdit: (macro: Macro) => {}, 
    handleDone: () => {} 
  }
}

