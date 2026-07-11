import MacroItemEditor from './MacroItemEditor'
import { t } from '../../lib/i18n'
import { Macro } from '../../types'

export default function MacroListEditor({ macros, onEdit, onDelete }: {
  macros: Macro[],
  onEdit: (m: Macro) => void,
  onDelete: (id: string) => void,
}) {
  if (!macros?.length) return <p className="empty-state padding-relaxed ink-soft font-md">{t('macroListEditor.noMacros')}</p>
  return (
    <div className="vertical gap-snug">
      {macros.map(m => <MacroItemEditor key={m.id} macro={m} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  )
}
