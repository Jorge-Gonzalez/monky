// The macro form's model, shared by the modal editor and the standalone page. Both surfaces
// had this identical: the same four fields, the same three effects, the same validity
// derivation, and the same submit down to the shape of the payload. What differed was only
// what happens after a successful save -- the modal toasts and closes, the page clears and
// stays -- so `submit` reports the outcome and leaves that decision to the caller.
import { useEffect, useRef, useState } from 'react'
import type { Macro } from '../types'
import type { ContentEditorRef } from './content-editor'
import { useMacroStore } from '../store/useMacroStore'
import { createMacro, updateMacro } from '../store/macroCrud'
import { isCommandValid, validateCommand } from './macroValidation'
import { extractPlainText, hasRichFormatting } from './macroContent'

/** What the caller needs in order to decide what happens next. */
export type SubmitOutcome =
  | { status: 'invalid' }
  | { status: 'failed'; error: string }
  | { status: 'created' }
  | { status: 'updated' }

export function useMacroForm(editing: Macro | null) {
  const prefixes = useMacroStore((s) => s.config?.prefixes || ['/'])
  const [command, setCommand] = useState(editing?.command || '')
  const [text, setText] = useState(editing?.html || editing?.text || '')
  const [isSensitive, setSensitive] = useState(!!editing?.is_sensitive)
  const [error, setError] = useState<string | null>(null)

  const commandInputRef = useRef<HTMLInputElement>(null)
  const contentEditorRef = useRef<ContentEditorRef>(null)

  // Load the macro under edit, or clear back to a blank form.
  useEffect(() => {
    setCommand(editing?.command ?? '')
    setText(editing ? editing.html || editing.text : '')
    setSensitive(!!editing?.is_sensitive)
    setError(null)
  }, [editing])

  // Clear any error as soon as the user edits either field. Setting state to the value it
  // already holds is a no-op, so this needs no guard -- and therefore no dependency on
  // `error`, which would otherwise clear the error on the render that set it.
  useEffect(() => {
    setError(null)
  }, [command, text])

  useEffect(() => {
    commandInputRef.current?.focus()
  }, [editing?.id])

  const commandValid = isCommandValid(command, prefixes)
  const isDirty =
    !editing ||
    command !== editing.command ||
    text !== (editing.html || editing.text) ||
    isSensitive !== !!editing.is_sensitive
  const isFormValid = commandValid && text.trim() !== '' && isDirty

  const submit = async (): Promise<SubmitOutcome> => {
    setError(null)

    const commandError = validateCommand(command, prefixes)
    if (commandError) {
      setError(commandError)
      return { status: 'invalid' }
    }
    if (!text.trim()) {
      setError('Text content is required')
      return { status: 'invalid' }
    }

    // Rich content is stored as both: `html` for fidelity, `text` for the plain-text
    // insertion path and for search.
    const rich = hasRichFormatting(text)
    const payload = {
      command,
      text: extractPlainText(text),
      html: rich ? text : undefined,
      contentType: rich ? ('text/html' as const) : ('text/plain' as const),
      is_sensitive: isSensitive,
    }

    const editingId = editing?.id
    const result = editingId ? await updateMacro(String(editingId), payload) : await createMacro(payload)
    if (!result.success) {
      if (result.error) setError(result.error)
      return { status: 'failed', error: result.error ?? '' }
    }
    return { status: editingId ? 'updated' : 'created' }
  }

  return {
    prefixes,
    command,
    setCommand,
    text,
    setText,
    isSensitive,
    setSensitive,
    error,
    setError,
    commandValid,
    isFormValid,
    commandInputRef,
    contentEditorRef,
    submit,
  }
}
