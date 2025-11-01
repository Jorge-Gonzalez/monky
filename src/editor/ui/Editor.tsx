import { useEffect, useState } from 'react'
import MacroForm from './MacroForm'
import MacroListEditor from './MacroListEditor'
import { useEditorManager } from '../managers/useEditorManager'
import Settings from './Settings'
import { t } from '../../lib/i18n'

export default function Editor(){
  const manager = useEditorManager();
  const [state, setState] = useState(manager.getState());
  
  // Subscribe to manager state changes
  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  const handleEdit = (macro: any) => {
    manager.setEditingMacro(macro);
  };

  const handleDone = () => {
    manager.resetForm();
  };

  return (
    <div className="page-container">
      <h1 className="page-title">{t('editor.title')}</h1>
      <MacroForm editing={state.editingMacro} onDone={handleDone} manager={manager}/>
      <hr className="divider" />
      <Settings manager={manager} language={state.settings.language} />
      <MacroListEditor macros={state.macros} onEdit={handleEdit} manager={manager} />
    </div>
  )
}
