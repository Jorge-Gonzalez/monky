import { t } from '../../../../../lib/i18n';
import { MacroEditorViewProps } from '../../../modal/types';
import { useMacroEditor } from '../../../../../editor/useMacroEditor';
import { ModalMacroForm } from './ModalMacroForm';

export function MacroEditorView({ initialMacro, onViewChange }: MacroEditorViewProps) {
  const { editingMacro, setEditingMacro, resetForm } = useMacroEditor(initialMacro ?? null);

  const handleDone = () => {
    resetForm();
    onViewChange('search');
  };

  const title = editingMacro
    ? t('macroEditor.title.edit', { command: editingMacro.command })
    : t('macroEditor.title.new');

  return (
    <div className="macro-editor-view">
      <div className="editor-container">
        <h1 className="view-title">{title}</h1>
        <ModalMacroForm
          editing={editingMacro}
          onDone={handleDone}
          onLoadMacro={setEditingMacro}
        />
      </div>
    </div>
  );
}
