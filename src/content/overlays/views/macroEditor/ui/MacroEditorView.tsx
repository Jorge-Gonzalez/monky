import { useState, useEffect } from 'react';
import { t } from '../../../../../lib/i18n';
import { MacroEditorViewProps } from '../../../modal/types';
import { useEditorCoordinator } from '../../../../../editor/hooks/useEditorCoordinator';
import MacroForm from '../../../../../editor/ui/MacroForm';

export function MacroEditorView({ containerRef, initialMacro, onViewChange }: MacroEditorViewProps) {
  const coordinator = useEditorCoordinator();
  const [state, setState] = useState(coordinator.getState());

  useEffect(() => {
    const unsubscribe = coordinator.subscribe(setState);
    return unsubscribe;
  }, [coordinator]);

  useEffect(() => {
    if (initialMacro) {
      coordinator.setEditingMacro(initialMacro);
    } else {
      coordinator.resetForm();
    }
  }, []);

  const handleDone = () => {
    coordinator.resetForm();
    onViewChange('search');
  };

  const title = state.editingMacro
    ? t('macroEditor.title.edit', { command: state.editingMacro.command })
    : t('macroEditor.title.new');

  return (
    <div className="macro-editor-view">
      <div className="editor-container">
        <h1 className="view-title">{title}</h1>
        <MacroForm
          editing={state.editingMacro}
          onDone={handleDone}
          coordinator={coordinator}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
}
