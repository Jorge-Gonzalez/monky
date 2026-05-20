import React from 'react'
import { EditorCoordinator } from '../coordinators/editorCoordinator'
import { t } from '../../lib/i18n'


export default function MacroItemEditor({ macro, onEdit, coordinator }:{ macro:any, onEdit:(m:any)=>void, coordinator: EditorCoordinator }){
  async function onDelete(){
    if (coordinator) {
      await coordinator.deleteMacro(String(macro.id));
    }
  }

  return (
    <div className="card">
      <div>
        <span className="text-mono font-semibold">{macro.command}</span>
        <span style={{ marginLeft: '8px', fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>{macro.text.slice(0,80)}{macro.text.length>80?'…':''}</span>
      </div>
      <div className="button-group" style={{ marginTop: 'var(--spacing-md)' }}>
        <button className="btn-link" onClick={()=>onEdit(macro)}>{t('macroItemEditor.edit')}</button>
        <button className="btn-link-danger" onClick={onDelete}>{t('macroItemEditor.delete')}</button>
      </div>
    </div>
  )
}
