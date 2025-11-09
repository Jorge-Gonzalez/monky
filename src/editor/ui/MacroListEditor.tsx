import React from 'react'
import MacroItemEditor from './MacroItemEditor'
import { t } from '../../lib/i18n'
import { EditorCoordinator } from '../coordinators/editorCoordinator'

export default function MacroListEditor({ macros, onEdit, coordinator }:{ macros:any[], onEdit:(m:any)=>void, coordinator: EditorCoordinator }){
  if (!macros?.length) return <p className="empty-state">{t('macroListEditor.noMacros')}</p>
  return (<div className="space-y-sm">{macros.map(m => <MacroItemEditor key={m.id} macro={m} onEdit={onEdit} coordinator={coordinator} />)}</div>)
}
