import { useState, useEffect, useRef, RefObject } from 'react'
import { insertLink, removeLink } from './editorCommands'
import { icons } from './icons'

interface ContentEditorLinkFieldProps {
  savedRange: Range | null
  existingHref: string | null
  editorRef: RefObject<HTMLDivElement>
  onClose: () => void
}

export function ContentEditorLinkField({
  savedRange,
  existingHref,
  editorRef,
  onClose,
}: ContentEditorLinkFieldProps) {
  const [url, setUrl] = useState(existingHref ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const confirm = () => {
    const trimmed = url.trim()
    if (trimmed) {
      insertLink(trimmed, savedRange ?? undefined)
    } else if (existingHref) {
      removeLink(savedRange ?? undefined)
    }
    editorRef.current?.focus()
    onClose()
  }

  const cancel = () => {
    onClose()
    editorRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); confirm() }
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
  }

  return (
    <div className="ce-link-field horizontal elastic basis-ratio gap-tight align-center">
      <span className="ce-toolbar-icon horizontal rigid align-center ink-soft" dangerouslySetInnerHTML={{ __html: icons.link }} />
      <input
        ref={inputRef}
        type="url"
        className="ce-link-input elastic basis-ratio ground-subtle ink rule corner-sm ruled font-sm focus:rule-accent focus:ring"
        value={url}
        onChange={e => setUrl(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        placeholder="Paste or type a URL…"
      />
      <button
        type="button"
        className="ce-toolbar-btn horizontal rigid align-center justify-center ink-soft corner-sm pressable hover:ground-defined hover:ink"
        onMouseDown={e => { e.preventDefault(); confirm() }}
        title="Apply (Enter)"
        aria-label="Apply link"
        dangerouslySetInnerHTML={{ __html: icons.check }}
      />
      <button
        type="button"
        className="ce-toolbar-btn horizontal rigid align-center justify-center ink-soft corner-sm pressable hover:ground-defined hover:ink"
        onMouseDown={e => { e.preventDefault(); cancel() }}
        title="Cancel (Escape)"
        aria-label="Cancel"
        dangerouslySetInnerHTML={{ __html: icons.x }}
      />
    </div>
  )
}
