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
    <div className="card">
      <div>
        <span className="text-mono font-semibold">{macro.command}</span>
        <span style={{ marginLeft: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{macro.text.slice(0,80)}{macro.text.length>80?'…':''}</span>
      </div>
      <div className="button-group" style={{ marginTop: 'var(--spacing-md)' }}>
        <button className="btn-link" onClick={()=>onEdit(macro)}>{t('macroItemEditor.edit')}</button>
        <button className="btn-link-danger" onClick={onDelete}>{t('macroItemEditor.delete')}</button>
      </div>
    </div>
  )
}
