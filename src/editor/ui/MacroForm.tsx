import React, { useEffect, useState, useRef } from 'react'
import { useMacroStore } from '../../store/useMacroStore'
import { t } from '../../lib/i18n'
import { EditorCoordinator } from '../coordinators/editorCoordinator'
import { Macro } from '../../types'
import { ContentEditor, ContentEditorRef } from '../../shared/content-editor'

export default function MacroForm({ editing, onDone, coordinator }: {
  editing: Macro | null,
  onDone: () => void,
  coordinator: EditorCoordinator,
}) {
  const prefixes = useMacroStore(s => s.config?.prefixes || ['/'])
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

  useEffect(() => {
    if (error) setError(null)
  }, [command, text])

  useEffect(() => {
    commandInputRef.current?.focus()
  }, [editing?.id])

  const isCommandValid = command.trim() !== '' && prefixes.some(prefix => command.startsWith(prefix))
  const isTextValid = text.trim() !== ''
  const isFormValid = isCommandValid && isTextValid

  function validateCommand(cmd: string): string | null {
    if (!cmd.trim()) return 'Command is required'
    if (!prefixes.some(prefix => cmd.startsWith(prefix))) {
      return `Command must start with one of: ${prefixes.join(', ')}`
    }
    return null
  }

  function hasRichFormatting(html: string): boolean {
    const richElements = /<(?:strong|b|em|i|u|ul|ol|li|br|a\s|span\s)/i
    return richElements.test(html) || html.includes('<br')
  }

  function traverse(node: Node, text: string, listCounters: number[]): string {
    if (node.nodeType === Node.TEXT_NODE) {
      let textContent = node.textContent?.replace(/\s+/g, ' ') || ''
      const blockquote = (node.parentElement as HTMLElement)?.closest('blockquote')
      if (blockquote) {
        textContent = textContent.split('\n').map(line =>
          line.trim() ? `> ${line}` : line
        ).join('\n')
      }
      text += textContent
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      const tagName = element.tagName.toLowerCase()
      const isBlock = ['div', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'].includes(tagName)
      const isList = ['ul', 'ol'].includes(tagName)
      const isListItem = tagName === 'li'

      if (tagName === 'br') { text += '\n'; return text }

      if (isList) {
        if (text.length > 0 && !text.endsWith('\n')) text += '\n'
        if (tagName === 'ol') listCounters.push(1)
      } else if (tagName === 'blockquote') {
        if (text.length > 0 && !text.endsWith('\n')) text += '\n'
      } else if (isListItem) {
        if (text.length > 0 && !text.endsWith('\n')) text += '\n'
        const parentTag = element.parentElement?.tagName.toLowerCase()
        if (parentTag === 'ol') {
          const counter = listCounters[listCounters.length - 1]
          listCounters[listCounters.length - 1]++
          text += `${counter}. `
        } else {
          text += '• '
        }
      } else if (isBlock) {
        if (text.length > 0 && !text.endsWith('\n')) text += '\n'
      }

      for (const child of Array.from(element.childNodes)) {
        text = traverse(child, text, listCounters)
      }

      if (isList) {
        if (tagName === 'ol') listCounters.pop()
        if (!text.endsWith('\n')) text += '\n'
        if (!text.endsWith('\n\n')) text += '\n'
      } else if (tagName === 'blockquote') {
        if (!text.endsWith('\n')) text += '\n'
        if (!text.endsWith('\n\n')) text += '\n'
      } else if (isBlock && !isListItem) {
        if (!text.endsWith('\n')) text += '\n'
        if (tagName === 'p' && !text.endsWith('\n\n')) text += '\n'
      }
    }
    return text
  }

  function extractPlainText(html: string): string {
    const tempEl = document.createElement('div')
    tempEl.innerHTML = html
    return traverse(tempEl, '', []).replace(/\n{3,}/g, '\n\n').trim()
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const commandError = validateCommand(command)
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
    if (editing && editing.id) {
      result = await coordinator.updateMacro(String(editing.id), macroData)
      if (result.success) onDone()
    } else {
      result = await coordinator.createMacro(macroData)
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
        <label htmlFor="macro-command" className="label">
          {t('macroForm.triggerLabel')}
        </label>
        <input
          id="macro-command"
          ref={commandInputRef}
          className={`input ${command && !isCommandValid ? 'input-error' : ''}`}
          value={command}
          onChange={e => setCommand(e.currentTarget.value)}
          placeholder={`e.g., ${prefixes[0]}sig`}
          maxLength={50}
        />
        {command && !isCommandValid && (
          <p className="validation-error">
            Command must start with: {prefixes.join(', ')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="macro-text" className="label">
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
