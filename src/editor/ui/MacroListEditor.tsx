import MacroItemEditor from './MacroItemEditor'
import { t } from '../../lib/i18n'
import type { Macro } from '../../types'

export default function MacroListEditor({ macros, onEdit, onDelete }: {
  macros: Macro[],
  onEdit: (m: Macro) => void,
  onDelete: (id: string) => void,
}) {
  if (!macros?.length) return <p className="padding-lg
    ink-soft font-md text-center">{t('macroListEditor.noMacros')}</p>
  return (
    <div className="vertical gap-sm">
      {macros.map(m => <MacroItemEditor key={m.id} macro={m} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  )
}
