import type { MacroEditorViewProps } from '../../../modal/types'
import { useMacroEditor } from '../../../../../editor/useMacroEditor'
import { ModalMacroForm } from './ModalMacroForm'

export function MacroEditorView({ initialMacro, onClose }: MacroEditorViewProps) {
  const { editingMacro, setEditingMacro } = useMacroEditor(initialMacro ?? null)

  // Finishing the editor (saved or cancelled) closes the whole modal, rather than
  // dropping back to the search view — the editor is a task you complete and dismiss.
  const handleDone = onClose

  return (
    <div data-component="editor-view" className="vertical padding-xl fill-block
      ink">
      <ModalMacroForm
        editing={editingMacro}
        onDone={handleDone}
        onLoadMacro={setEditingMacro}
      />
    </div>
  )
}
