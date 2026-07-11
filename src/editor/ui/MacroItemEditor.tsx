import { t } from '../../lib/i18n'
import { Macro } from '../../types'

export default function MacroItemEditor({ macro, onEdit, onDelete }: {
  macro: Macro,
  onEdit: (m: Macro) => void,
  onDelete: (id: string) => void,
}) {
  return (
    <div className="card ground rule corner-md padding-comfortable">
      <div>
        <span className="text-mono font-semibold">{macro.command}</span>
        <span style={{ marginLeft: '8px', fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>{macro.text.slice(0,80)}{macro.text.length>80?'…':''}</span>
      </div>
      <div className="button-group" style={{ marginTop: 'var(--spacing-md)' }}>
        <button className="btn-link" onClick={() => onEdit(macro)}>{t('macroItemEditor.edit')}</button>
        <button className="btn-link-danger" onClick={() => onDelete(String(macro.id))}>{t('macroItemEditor.delete')}</button>
      </div>
    </div>
  )
}
