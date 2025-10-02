import React from 'react'
import MacroForm from './MacroForm'
import MacroListEditor from './MacroListEditor'
import { useMacroStore } from '../../store/useMacroStore'
import Settings from './Settings'
import { t } from '../../lib/i18n'
import { useEditor } from '../hooks/useEditor'
export default function Editor(){
  const macros = useMacroStore(s=>s.macros)
  const { editingMacro, handleEdit, handleDone } = useEditor()
  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">{t('editor.title')}</h1>
      <MacroForm editing={editingMacro} onDone={handleDone}/>
      <hr className="my-6" />
      <Settings />
      <MacroListEditor macros={macros} onEdit={handleEdit} />
    </div>
  )
}
