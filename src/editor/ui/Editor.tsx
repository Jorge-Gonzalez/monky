// The standalone editor page: the form on the left, the macro list on the right.
//
// The two columns stack with no breakpoint named anywhere. They are flex items that are
// allowed to wrap, each with a minimum inline size, so the row breaks exactly when it can no
// longer hold `min-width-lg + min-width-md`, and each column then takes the full width. A
// media or container query would have meant inventing a pixel figure and asserting the layout
// changes there; this way it changes when the layout actually runs out of room, which is what
// the query would have been approximating. Ermine's `container-<bp>:` scope could not have
// served either: the emitter declines to serialize it, because a breakpoint value is a project
// decision and `@container (min-width: var(--x))` is not valid CSS.
//
// Settings are deliberately absent. They live on the options page, and a page that both edits
// a macro and configures the extension is two pages.
import MacroForm from './MacroForm'
import { MacroPanel } from './MacroPanel'
import { useMacroStore } from '../../store/useMacroStore'
import { useMacroEditor } from '../useMacroEditor'
import { t } from '../../lib/i18n'

export default function Editor() {
  const macros = useMacroStore((s) => s.macros)
  const { editingMacro, setEditingMacro, resetForm } = useMacroEditor()

  return (
    <div className="vertical gap-lg padding-2xl centered flush-block max-width-2xl fill-viewport">
      <h1 className="font-2xl">{t('editor.pageTitle')}</h1>
      <div
        data-component="editor-columns"
        className="horizontal gap-xl align-start wrap-allowed"
      >
        <section
          data-component="editor-form-column"
          className="vertical grow-2 shrink-1 basis-ratio gap-lg min-width-lg"
        >
          <MacroForm
            editing={editingMacro}
            onDone={resetForm}
          />
        </section>
        <MacroPanel
          macros={macros}
          onEdit={setEditingMacro}
        />
      </div>
    </div>
  )
}
