import React from 'react'
import MacroItemEditor from './MacroItemEditor'
import { t } from '../../lib/i18n'
import { EditorManager } from '../managers/createEditorManager'

export default function MacroListEditor({ macros, onEdit, manager }:{ macros:any[], onEdit:(m:any)=>void, manager: EditorManager }){
  if (!macros?.length) return <p className="empty-state">{t('macroListEditor.noMacros')}</p>
  return (<div className="space-y-sm">{macros.map(m => <MacroItemEditor key={m.id} macro={m} onEdit={onEdit} manager={manager} />)}</div>)
}
