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
    <div className="vertical gap-lg padding-2xl centered flush-block max-width-2xl fill-viewport">
      <h1 className="font-2xl">{t('editor.pageTitle')}</h1>
      <MacroForm editing={editingMacro} onDone={resetForm} />
      <hr className="rule ruled-top" />
      <Settings />
      <MacroListEditor macros={macros} onEdit={setEditingMacro} onDelete={id => { void deleteMacro(id) }} />
    </div>
  )
}
