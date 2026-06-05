import React, { useEffect, useState, useRef } from 'react'
import { Macro } from '../../../../../types'
import { t } from '../../../../../lib/i18n'
import { createMacro, updateMacro } from '../../../../../store/macroCrud'
import { ContentEditor, ContentEditorRef } from '../../../../../shared/content-editor'
import { useMacroStore } from '../../../../../store/useMacroStore'
import { validateCommand, isCommandValid } from '../../../../../shared/macroValidation'
import { hasRichFormatting, extractPlainText } from '../../../../../shared/macroContent'
import { useCommandSuggestions } from '../useCommandSuggestions'
import { CommandSuggestions } from './CommandSuggestions'

// How long the success toast shows before the modal closes.
const SAVE_TOAST_MS = 900

interface ModalMacroFormProps {
  editing: Macro | null
  onDone: () => void
  onLoadMacro: (macro: Macro) => void
}

export function ModalMacroForm({ editing, onDone, onLoadMacro }: ModalMacroFormProps) {
  const prefixes = useMacroStore(s => s.config?.prefixes || ['/'])
  const [command, setCommand] = useState(editing?.command || '')
  const [text, setText] = useState(editing?.html || editing?.text || '')
  const [isSensitive, setSensitive] = useState(!!editing?.is_sensitive)
  const [error, setError] = useState<string | null>(null)
  const [savedToast, setSavedToast] = useState<string | null>(null)

  const commandInputRef = useRef<HTMLInputElement>(null)
  const contentEditorRef = useRef<ContentEditorRef>(null)

  const suggest = useCommandSuggestions(command, !editing, onLoadMacro)

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

  useEffect(() => {
    if (error) setError(null)
  }, [command, text])

  useEffect(() => {
    commandInputRef.current?.focus()
  }, [editing?.id])

  const commandValid = isCommandValid(command, prefixes)
  const isTextValid = text.trim() !== ''
  const isDirty = !editing ||
    command !== editing.command ||
    text !== (editing.html || editing.text) ||
    isSensitive !== !!editing.is_sensitive
  const isFormValid = commandValid && isTextValid && isDirty

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const commandError = validateCommand(command, prefixes)
    if (commandError) { setError(commandError); return }
    if (!text.trim()) { setError('Text content is required'); return }

    const hasRichContent = hasRichFormatting(text)
    const plainText = extractPlainText(text)

    const macroData = {
      command,
      text: plainText,
      html: hasRichContent ? text : undefined,
      contentType: hasRichContent ? 'text/html' as const : 'text/plain' as const,
      is_sensitive: isSensitive,
    }

    const result = editing?.id
      ? await updateMacro(String(editing.id), macroData)
      : await createMacro(macroData)

    if (result.success) {
      // Confirm the save, then close the modal. Both create and edit finish the
      // same way — the editor is a task you complete and dismiss.
      setSavedToast(editing ? t('macroForm.updatedToast') : t('macroForm.savedToast'))
      window.setTimeout(onDone, SAVE_TOAST_MS)
      return
    }
    if (result.error) setError(result.error)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-md">
      <div>
        <label htmlFor="modal-macro-command" className="label">
          {t('macroForm.triggerLabel')}
        </label>
        <div className="command-suggestion-wrapper">
          <input
            id="modal-macro-command"
            ref={commandInputRef}
            className={`input ${command && !commandValid ? 'input-error' : ''} ${suggest.visible ? 'input-suggestions-open' : ''}`}
            value={command}
            onChange={e => setCommand(e.currentTarget.value)}
            placeholder={`e.g., ${prefixes[0]}sig`}
            maxLength={50}
            autoComplete="off"
            {...suggest.inputProps}
          />
          {suggest.visible && (
            <CommandSuggestions
              suggestions={suggest.suggestions}
              selectedIndex={suggest.selectedIndex}
              onSelect={suggest.select}
            />
          )}
        </div>
        {command && !commandValid && (
          <p className="validation-error">
            Command must start with: {prefixes.join(', ')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="modal-macro-text" className="label">
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
        <div className="alert alert-error">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {savedToast && (
        <div className="alert alert-success" role="status">
          <p className="font-medium">{savedToast}</p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <input
            type="checkbox"
            checked={isSensitive}
            onChange={e => setSensitive(e.currentTarget.checked)}
            className="checkbox"
          />
          <span className="label" style={{ marginBottom: 0 }}>{t('macroForm.sensitiveLabel')}</span>
        </label>

        <div className="button-group">
          <button
            type="submit"
            disabled={!isFormValid || savedToast !== null}
            className="btn btn-outlined btn-success"
          >
            {editing ? t('macroForm.updateButton') : t('macroForm.saveButton')}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-outlined btn-secondary"
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
