import type { FormEvent } from 'react'
import { t } from '../../lib/i18n'
import type { Macro } from '../../types'
import { ContentEditor } from '../../shared/content-editor'
import { useMacroForm } from '../../shared/useMacroForm'

export default function MacroForm({ editing, onDone }: { editing: Macro | null; onDone: () => void }) {
  const {
    prefixes,
    command,
    setCommand,
    text,
    setText,
    isSensitive,
    setSensitive,
    error,
    commandValid,
    isFormValid,
    commandInputRef,
    contentEditorRef,
    submit,
  } = useMacroForm(editing)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const outcome = await submit()
    // An update finishes the task; a create leaves the form open for the next one.
    if (outcome.status === 'updated') onDone()
    if (outcome.status === 'created') {
      setCommand('')
      setText('')
      // is_sensitive deliberately survives, as it did before this was extracted: several
      // sensitive macros in a row is the case that behaviour serves. Whether it should is
      // a product question, not something to change inside a refactor.
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e)
      }}
      className="vertical gap-md"
    >
      <div>
        <label
          htmlFor="macro-command"
          className="boxed
            ink font-sm font-medium"
        >
          {t('macroForm.triggerLabel')}
        </label>
        <input
          id="macro-command"
          ref={commandInputRef}
          className={`padding-block-sm padding-inline-md fill-inline tween-rule-quick ground-subtle ink rule corner-3xl ruled font-md recessed-soft focus:rule-accent-soft focus:ring-accent-soft ${command && !commandValid ? 'rule-fail focus:rule-fail focus:recessed-fail' : ''}`}
          value={command}
          onChange={(e) => setCommand(e.currentTarget.value)}
          placeholder={`e.g., ${prefixes[0]}sig`}
          maxLength={50}
          aria-invalid={command && !commandValid ? true : undefined}
        />
        {command && !commandValid && (
          <p className="ink-fail font-xs">Command must start with: {prefixes.join(', ')}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="macro-text"
          className="boxed
            ink font-sm font-medium"
        >
          {t('macroForm.textLabel')}
        </label>
        <ContentEditor
          ref={contentEditorRef}
          value={text}
          onChange={setText}
          placeholder="Enter your macro content..."
        />
      </div>

      {error && (
        <div
          className="padding-md
            ground-fail-faint ink-fail rule-fail corner-md ruled"
        >
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <input
            type="checkbox"
            checked={isSensitive}
            onChange={(e) => setSensitive(e.currentTarget.checked)}
            className="control-size-lg
              rule corner-sm ruled pressable
              focus:ring"
          />
          <span
            className="boxed
              ink font-sm font-medium"
          >
            {t('macroForm.sensitiveLabel')}
          </span>
        </label>

        <div className="horizontal inline">
          <button
            type="submit"
            disabled={!isFormValid}
            className="padding-block-sm padding-inline-lg
              tween-quick
              ground-pass ink-inverse rule corner-md ruled font-md font-medium pressable
              hover:ground-pass
              focus:ring
              active:ground-accent active:ink-inverse
              disabled:ground-subtle disabled:ink-soft disabled:blocked disabled:alpha-60"
          >
            {editing ? t('macroForm.updateButton') : t('macroForm.saveButton')}
          </button>
          {editing && (
            <button
              type="button"
              className="padding-block-sm padding-inline-lg
                tween-quick
                ground ink rule corner-md ruled font-md font-medium pressable
                hover:ground-defined
                focus:ring
                active:ground-accent active:ink-inverse
                disabled:ground-subtle disabled:ink-soft disabled:blocked disabled:alpha-60"
              onClick={onDone}
            >
              {t('macroForm.cancelButton')}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
