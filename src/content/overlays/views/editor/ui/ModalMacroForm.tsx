import React, { useEffect, useState, useRef } from 'react'
import { Macro } from '../../../../../types'
import { t } from '../../../../../lib/i18n'
import { createMacro, updateMacro, deleteMacro } from '../../../../../store/macroCrud'
import { ContentEditor, ContentEditorRef } from '../../../../../shared/content-editor'
import { useMacroStore } from '../../../../../store/useMacroStore'
import { validateCommand, isCommandValid } from '../../../../../shared/macroValidation'
import { hasRichFormatting, extractPlainText } from '../../../../../shared/macroContent'
import { useCommandSuggestions } from '../useCommandSuggestions'
import { CommandSuggestions } from './CommandSuggestions'

// How long the success toast shows before the modal closes.
const SAVE_TOAST_MS = 900

const PopoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M14 4h6m0 0v6m0-6L10 14M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
  </svg>
)

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
  const commandValid = isCommandValid(command, prefixes)
  const commandJoined = Boolean((command && !commandValid) || suggest.visible)

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

  const isTextValid = text.trim() !== ''
  const isDirty = !editing ||
    command !== editing.command ||
    text !== (editing.html || editing.text) ||
    isSensitive !== !!editing.is_sensitive
  const isFormValid = commandValid && isTextValid && isDirty

  // Open the full-page editor (a content script can't call chrome.tabs directly;
  // the background opens the tab).
  const openFullEditor = () => { chrome.runtime.sendMessage('open-editor') }

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
    <form onSubmit={onSubmit} className="vertical elastic basis-ratio gap-md min-height-none position-relative">
      <div className="horizontal gap-lg align-center justify-between">
        <div className="horizontal rigid gap-sm align-center">
          <h1 className="ink font-lg font-semibold">
            {editing ? t('editor.title.editShort') : t('editor.title.newShort')}
          </h1>
          <button
            type="button"
            className="horizontal padding-xs align-center justify-center ink-soft corner-sm pressable tween-ground-ink-quick hover:ground-defined hover:ink-accent"
            onClick={openFullEditor}
            aria-label={t('editor.openFullEditor')}
            title={t('editor.openFullEditor')}
          >
            <PopoutIcon />
          </button>
        </div>

        <div className="horizontal gap-sm align-center">
          <span>
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 16 16">
              <polygon fill="currentColor" points="7,9 4,9 10,0 8,7 11,7 5.417,15 "/>
            </svg>
          </span>
          <div className="elastic basis-ratio width-popover-lg position-relative">
            <input
              id="modal-macro-command"
              ref={commandInputRef}
              className={`fill-inline padding-block-sm padding-inline-md ground-subtle ink rule ${commandJoined ? 'corner-top-3xl corner-bottom-none' : 'corner-3xl'} ruled recessed-soft font-md tween-rule-quick focus:rule-accent-soft focus:ring-accent-soft ${command && !commandValid ? 'rule-fail focus:rule-fail focus:recessed-fail' : ''}`}
              value={command}
              onChange={e => setCommand(e.currentTarget.value)}
              placeholder={t('macroForm.commandPlaceholder', { prefix: prefixes[0] })}
              aria-label={t('macroForm.triggerLabel')}
              aria-invalid={command && !commandValid ? true : undefined}
              maxLength={50}
              autoComplete="off"
              {...suggest.inputProps}
            />
            {command && !commandValid && (
              <div className={`padding-block-xs padding-inline-sm ${suggest.visible ? 'corner-bottom-none' : 'corner-bottom-md'} ground-fail-faint ink-fail font-xs`}>
                {t('macroForm.commandPrefixError', { prefixes: prefixes.join(', ') })}
              </div>
            )}
            {suggest.visible && (
              <CommandSuggestions
                suggestions={suggest.suggestions}
                selectedIndex={suggest.selectedIndex}
                onSelect={suggest.select}
                onDelete={m => deleteMacro(String(m.id))}
              />
            )}
          </div>
        </div>
      </div>

      <ContentEditor
        ref={contentEditorRef}
        className="elastic basis-ratio min-height-none"
        value={text}
        onChange={setText}
        placeholder={t('macroForm.contentPlaceholder')}
      />

      <div className="horizontal rigid gap-md align-center justify-between">
        <label className="horizontal gap-sm align-center ink font-sm pressable">
          <input
            type="checkbox"
            checked={isSensitive}
            onChange={e => setSensitive(e.currentTarget.checked)}
            className="control-size-lg rule corner-sm ruled pressable focus:ring"
          />
          <span>{t('macroForm.sensitiveLabel')}</span>
        </label>

        <div className="horizontal inline gap-sm">
          {editing && (
            <button
              type="button"
              className="tween-quick padding-block-sm padding-inline-lg ground ink rule corner-md ruled font-md font-medium pressable hover:ground-defined focus:ring active:ground-accent active:ink-inverse disabled:blocked disabled:ground-subtle disabled:ink-soft disabled:alpha-60"
              onClick={onDone}
            >
              {t('macroForm.cancelButton')}
            </button>
          )}
          <button
            type="submit"
            disabled={!isFormValid || savedToast !== null}
            className="tween-quick padding-block-sm padding-inline-lg ground-pass ink-inverse rule corner-md ruled font-md font-medium pressable hover:ground-pass focus:ring active:ground-accent active:ink-inverse disabled:blocked disabled:ground-subtle disabled:ink-soft disabled:alpha-60"
          >
            {editing ? t('macroForm.updateButton') : t('macroForm.saveButton')}
          </button>
        </div>
      </div>

      {(error || savedToast) && (
        <div className={`padding-md position-absolute center-x inset-bottom-3xl text-nowrap corner-md ruled elevated-soft ${error ? 'ground-fail-faint rule-fail ink-fail' : 'ground-pass-faint rule-pass ink-pass'}`} role="status">
          <p className="font-medium">{error ?? savedToast}</p>
        </div>
      )}
    </form>
  )
}
