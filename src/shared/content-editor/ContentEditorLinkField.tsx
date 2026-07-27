import type { RefObject } from 'react'
import { useState, useEffect, useRef } from 'react'
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
    <div data-component="ce-link-field" className="horizontal elastic basis-ratio gap-xs align-center">
      <span className="horizontal rigid padding-inline-xs padding-block-none align-center
        ink-soft" dangerouslySetInnerHTML={{ __html: icons.link }} />
      <input
        ref={inputRef}
        type="url"
        data-component="ce-link-input"
        className="elastic basis-ratio padding-inline-sm padding-block-none control-block-lg
          ground-subtle ink rule corner-sm ruled font-sm
          focus:rule-accent focus:ring"
        value={url}
        onChange={e => setUrl(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        placeholder="Paste or type a URL…"
      />
      <button
        type="button"
        data-component="ce-link-confirm"
        className="horizontal rigid padding-none align-center justify-center control-box-lg
          tween-ground-ink-quick
          ink-soft corner-sm pressable
          hover:ground-defined hover:ink"
        onMouseDown={e => { e.preventDefault(); confirm() }}
        title="Apply (Enter)"
        aria-label="Apply link"
        dangerouslySetInnerHTML={{ __html: icons.check }}
      />
      <button
        type="button"
        data-component="ce-link-cancel"
        className="horizontal rigid padding-none align-center justify-center control-box-lg
          tween-ground-ink-quick
          ink-soft corner-sm pressable
          hover:ground-defined hover:ink"
        onMouseDown={e => { e.preventDefault(); cancel() }}
        title="Cancel (Escape)"
        aria-label="Cancel"
        dangerouslySetInnerHTML={{ __html: icons.x }}
      />
    </div>
  )
}
