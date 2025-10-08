import React from 'react'
import MacroItemEditor from './MacroItemEditor'
import { t } from '../../lib/i18n'
import { EditorManager } from '../managers/createEditorManager'

export default function MacroListEditor({ macros, onEdit, manager }:{ macros:any[], onEdit:(m:any)=>void, manager: EditorManager }){
  if (!macros?.length) return <p className="text-gray-500">{t('macroListEditor.noMacros')}</p>
  return (<div className="space-y-2">{macros.map(m => <MacroItemEditor key={m.id} macro={m} onEdit={onEdit} manager={manager} />)}</div>)
}
