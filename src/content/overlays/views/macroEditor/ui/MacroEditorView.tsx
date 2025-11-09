import { useState, useEffect } from 'react';
import { BaseModalViewProps } from '../../../modal/types';
import { useEditorCoordinator } from '../../../../../editor/hooks/useEditorCoordinator';
import MacroForm from '../../../../../editor/ui/MacroForm';
import MacroListEditor from '../../../../../editor/ui/MacroListEditor';
import { t } from '../../../../../lib/i18n';

/**
 * MacroEditorView - Create and edit macros
 *
 * Integrates the macro editor functionality into the modal system
 */
export function MacroEditorView({ containerRef }: BaseModalViewProps) {
  const coordinator = useEditorCoordinator();
  const [state, setState] = useState(coordinator.getState());

  useEffect(() => {
    const unsubscribe = coordinator.subscribe(setState);
    return unsubscribe;
  }, [coordinator]);

  const handleEdit = (macro: any) => {
    coordinator.setEditingMacro(macro);
  };

  const handleDone = () => {
    coordinator.resetForm();
  };

  return (
    <div className="macro-editor-view">
      <div className="editor-container">
        <h1 className="view-title">{t('editor.title')}</h1>
        <MacroForm
          editing={state.editingMacro}
          onDone={handleDone}
          coordinator={coordinator}
          containerRef={containerRef}
        />
        <MacroListEditor macros={state.macros} onEdit={handleEdit} coordinator={coordinator} />
      </div>
    </div>
  );
}
