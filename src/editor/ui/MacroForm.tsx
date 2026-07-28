import { useEffect, useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { useMacroStore } from '../../store/useMacroStore'
import { createMacro, updateMacro } from '../../store/macroCrud'
import type { Result } from '../../store/macroCrud'
import { t } from '../../lib/i18n'
import type { Macro } from '../../types'
import type { ContentEditorRef } from '../../shared/content-editor'
import { ContentEditor } from '../../shared/content-editor'
import { validateCommand, isCommandValid } from '../../shared/macroValidation'
import { hasRichFormatting, extractPlainText } from '../../shared/macroContent'

export default function MacroForm({ editing, onDone }: { editing: Macro | null; onDone: () => void }) {
  const prefixes = useMacroStore((s) => s.config?.prefixes || ['/'])
  const [command, setCommand] = useState(editing?.command || '')
  const [text, setText] = useState(editing?.html || editing?.text || '')
  const [isSensitive, setSensitive] = useState(!!editing?.is_sensitive)
  const [error, setError] = useState<string | null>(null)

  const commandInputRef = useRef<HTMLInputElement>(null)
  const contentEditorRef = useRef<ContentEditorRef>(null)

  useEffect(() => {
    if (editing) {
      setCommand(editing.command)
      setText(editing.html || editing.text)
      setSensitive(!!editing.is_sensitive)
    } else {
      setCommand('')
      setText('')
      setSensitive(false)
    }
    setError(null)
  }, [editing])

  // Clear any error as soon as the user edits either field. Setting state to the value
  // it already holds is a no-op, so this needs no guard -- and therefore no dependency
  // on `error`, which would otherwise clear the error on the render that set it.
  useEffect(() => {
    setError(null)
  }, [command, text])

  useEffect(() => {
    commandInputRef.current?.focus()
  }, [editing?.id])

  const commandValid = isCommandValid(command, prefixes)
  const isTextValid = text.trim() !== ''
  const isDirty =
    !editing ||
    command !== editing.command ||
    text !== (editing.html || editing.text) ||
    isSensitive !== !!editing.is_sensitive
  const isFormValid = commandValid && isTextValid && isDirty

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const commandError = validateCommand(command, prefixes)
    if (commandError) {
      setError(commandError)
      return
    }
    if (!text.trim()) {
      setError('Text content is required')
      return
    }

    const hasRichContent = hasRichFormatting(text)
    const plainText = extractPlainText(text)

    const macroData = {
      command,
      text: plainText,
      html: hasRichContent ? text : undefined,
      contentType: hasRichContent ? ('text/html' as const) : ('text/plain' as const),
      is_sensitive: isSensitive,
    }

    let result: Result
    if (editing && editing.id) {
      result = await updateMacro(String(editing.id), macroData)
      if (result.success) onDone()
    } else {
      result = await createMacro(macroData)
      if (result.success) {
        setCommand('')
        setText('')
      }
    }
    if (!result.success && result.error) setError(result.error)
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
