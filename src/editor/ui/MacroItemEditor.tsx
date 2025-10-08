import React from 'react'
import { EditorManager } from '../managers/createEditorManager'
import { t } from '../../lib/i18n'


export default function MacroItemEditor({ macro, onEdit, manager }:{ macro:any, onEdit:(m:any)=>void, manager: EditorManager }){
  async function onDelete(){
    if (manager) {
      await manager.deleteMacro(macro.id);
    }
  }

  return (
    <div className="border rounded p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="text-sm">
        <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{macro.command}</span>
        <span className="ml-2 text-gray-600 dark:text-gray-400">{macro.text.slice(0,80)}{macro.text.length>80?'…':''}</span>
      </div>
      <div className="flex gap-3 mt-3">
        <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline" onClick={()=>onEdit(macro)}>{t('macroItemEditor.edit')}</button>
        <button className="text-red-600 dark:text-red-400 text-sm hover:underline" onClick={onDelete}>{t('macroItemEditor.delete')}</button>
      </div>
    </div>
  )
}
