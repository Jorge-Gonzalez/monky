import { useEffect, useState } from 'react'
import MacroForm from './MacroForm'
import MacroListEditor from './MacroListEditor'
import { useEditorCoordinator } from '../hooks/useEditorCoordinator'
import Settings from './Settings'
import { t } from '../../lib/i18n'

export default function Editor(){
  const coordinator = useEditorCoordinator();
  const [state, setState] = useState(coordinator.getState());
  
  // Subscribe to coordinator state changes
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
    <div className="page-container">
      <h1 className="page-title">{t('editor.title')}</h1>
      <MacroForm editing={state.editingMacro} onDone={handleDone} coordinator={coordinator}/>
      <hr className="divider" />
      <Settings coordinator={coordinator} language={state.settings.language} />
      <MacroListEditor macros={state.macros} onEdit={handleEdit} coordinator={coordinator} />
    </div>
  )
}
