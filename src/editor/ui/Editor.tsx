import React from 'react'
import MacroForm from './MacroForm'
import MacroListEditor from './MacroListEditor'
import { useEditorManager, EditorState } from '../managers/useEditorManager'
import Settings from './Settings'
import { t } from '../../lib/i18n'
import { useEffect, useState } from 'react'

export default function Editor(){
  const manager = useEditorManager();
  const [state, setState] = useState<EditorState>(manager.getState());
  
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
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">{t('editor.title')}</h1>
      <MacroForm editing={state.editingMacro} onDone={handleDone} manager={manager}/>
      <hr className="my-6" />
      <Settings manager={manager} language={state.settings.language} />
      <MacroListEditor macros={state.macros} onEdit={handleEdit} manager={manager} />
    </div>
  )
}
