import MacroForm from './MacroForm'
import MacroListEditor from './MacroListEditor'
import Settings from './Settings'
import { useMacroStore } from '../../store/useMacroStore'
import { deleteMacro } from '../../store/macroCrud'
import { useMacroEditor } from '../useMacroEditor'
import { t } from '../../lib/i18n'

export default function Editor() {
  const macros = useMacroStore(s => s.macros)
  const { editingMacro, setEditingMacro, resetForm } = useMacroEditor()

  return (
    <div className="page-container fill-viewport vertical gap-lg padding-2xl max-width-2xl centered flush-block">
      <h1 className="font-2xl">{t('editor.title')}</h1>
      <MacroForm editing={editingMacro} onDone={resetForm} />
      <hr className="divider rule ruled-top" />
      <Settings />
      <MacroListEditor macros={macros} onEdit={setEditingMacro} onDelete={deleteMacro} />
    </div>
  )
}
