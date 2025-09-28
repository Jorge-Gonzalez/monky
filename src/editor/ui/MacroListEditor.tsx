import React from 'react'
import MacroItemEditor from './MacroItemEditor'
import { t } from '../../lib/i18n'

export default function MacroListEditor({ macros, onEdit }:{ macros:any[], onEdit:(m:any)=>void }){
  if (!macros?.length) return <p className="text-gray-500">{t('macroListEditor.noMacros')}</p>
  return (<div className="space-y-2">{macros.map(m => <MacroItemEditor key={m.id} macro={m} onEdit={onEdit} />)}</div>)
}
