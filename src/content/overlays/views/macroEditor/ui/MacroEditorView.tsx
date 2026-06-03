import { useState, useEffect } from 'react';
import { Macro } from '../../../../../types';
import { t } from '../../../../../lib/i18n';
import { MacroEditorViewProps } from '../../../modal/types';
import { useEditorCoordinator } from '../../../../../editor/hooks/useEditorCoordinator';
import { ModalMacroForm } from './ModalMacroForm';

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

  const handleLoadMacro = (macro: Macro) => {
    coordinator.setEditingMacro(macro);
  };

  const title = state.editingMacro
    ? t('macroEditor.title.edit', { command: state.editingMacro.command })
    : t('macroEditor.title.new');

  return (
    <div className="macro-editor-view">
      <div className="editor-container">
        <h1 className="view-title">{title}</h1>
        <ModalMacroForm
          editing={state.editingMacro}
          onDone={handleDone}
          onLoadMacro={handleLoadMacro}
          coordinator={coordinator}
        />
      </div>
    </div>
  );
}
