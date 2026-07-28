import { t } from '../../lib/i18n'
import type { Macro } from '../../types'

export default function MacroItemEditor({
  macro,
  onEdit,
  onDelete,
}: {
  macro: Macro
  onEdit: (m: Macro) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className="padding-md
        ground rule corner-md ruled"
    >
      <div>
        <span className="font-semibold font-mono">{macro.command}</span>
        <span style={{ marginLeft: '8px', fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
          {macro.text.slice(0, 80)}
          {macro.text.length > 80 ? '…' : ''}
        </span>
      </div>
      <div
        className="horizontal inline"
        style={{ marginTop: 'var(--spacing-md)' }}
      >
        <button
          className="ink-accent font-sm undecorated
            hover:underlined"
          onClick={() => onEdit(macro)}
        >
          {t('macroItemEditor.edit')}
        </button>
        <button
          className="ink-fail font-sm undecorated
            hover:underlined"
          onClick={() => onDelete(String(macro.id))}
        >
          {t('macroItemEditor.delete')}
        </button>
      </div>
    </div>
  )
}
