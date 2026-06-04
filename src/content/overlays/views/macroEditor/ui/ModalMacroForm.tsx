import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Macro } from '../../../../../types'
import { t } from '../../../../../lib/i18n'
import { createMacro, updateMacro } from '../../../../../store/macroCrud'
import { ContentEditor, ContentEditorRef } from '../../../../../shared/content-editor'
import { useMacroStore } from '../../../../../store/useMacroStore'
import { validateCommand, isCommandValid } from '../../../../../shared/macroValidation'
import { hasRichFormatting, extractPlainText } from '../../../../../shared/macroContent'

const MAX_SUGGESTIONS = 5

interface ModalMacroFormProps {
  editing: Macro | null
  onDone: () => void
  onLoadMacro: (macro: Macro) => void
}

export function ModalMacroForm({ editing, onDone, onLoadMacro }: ModalMacroFormProps) {
  const prefixes = useMacroStore(s => s.config?.prefixes || ['/'])
  const macros = useMacroStore(s => s.macros)
  const [command, setCommand] = useState(editing?.command || '')
  const [text, setText] = useState(editing?.html || editing?.text || '')
  const [isSensitive, setSensitive] = useState(!!editing?.is_sensitive)
  const [error, setError] = useState<string | null>(null)
  const [commandFocused, setCommandFocused] = useState(false)
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)

  const commandInputRef = useRef<HTMLInputElement>(null)
  const contentEditorRef = useRef<ContentEditorRef>(null)

  const suggestions = useMemo(() => {
    if (editing || !command.trim()) return []
    const q = command.toLowerCase()
    return macros.filter(m => m.command.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS)
  }, [macros, command, editing])

  const showSuggestions = commandFocused && !suggestionsDismissed && suggestions.length > 0

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

  useEffect(() => {
    setSuggestionsDismissed(false)
    setSelectedSuggestion(-1)
  }, [command])

  const commandValid = isCommandValid(command, prefixes)
  const isTextValid = text.trim() !== ''
  const isDirty = !editing ||
    command !== editing.command ||
    text !== (editing.html || editing.text) ||
    isSensitive !== !!editing.is_sensitive
  const isFormValid = commandValid && isTextValid && isDirty

  function handleCommandKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && showSuggestions) {
      e.stopPropagation()
      setSuggestionsDismissed(true)
      return
    }
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestion(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestion(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (selectedSuggestion >= 0) {
        e.preventDefault()
        onLoadMacro(suggestions[selectedSuggestion])
      } else {
        const exactMatch = suggestions.find(m => m.command.toLowerCase() === command.toLowerCase())
        if (exactMatch) {
          e.preventDefault()
          onLoadMacro(exactMatch)
        } else {
          setSuggestionsDismissed(true)
        }
      }
    }
  }

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

    let result
    if (editing?.id) {
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
    <form onSubmit={onSubmit} className="space-y-md">
      <div>
        <label htmlFor="modal-macro-command" className="label">
          {t('macroForm.triggerLabel')}
        </label>
        <div className="command-suggestion-wrapper">
          <input
            id="modal-macro-command"
            ref={commandInputRef}
            className={`input ${command && !commandValid ? 'input-error' : ''} ${showSuggestions ? 'input-suggestions-open' : ''}`}
            value={command}
            onChange={e => setCommand(e.currentTarget.value)}
            onKeyDown={handleCommandKeyDown}
            onFocus={() => setCommandFocused(true)}
            onBlur={() => setCommandFocused(false)}
            placeholder={`e.g., ${prefixes[0]}sig`}
            maxLength={50}
            autoComplete="off"
          />
          {showSuggestions && (
            <div className="command-suggestions">
              <div className="command-suggestions-label">
                {t('macroEditor.commandSuggestionsLabel')}
              </div>
              {suggestions.map((macro, i) => (
                <div
                  key={macro.id}
                  className={`command-suggestion-item ${i === selectedSuggestion ? 'selected' : ''}`}
                  onMouseDown={e => { e.preventDefault(); onLoadMacro(macro) }}
                >
                  <span className="command-suggestion-command">{macro.command}</span>
                  <span className="command-suggestion-text">{macro.text}</span>
                </div>
              ))}
            </div>
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
            disabled={!isFormValid}
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
