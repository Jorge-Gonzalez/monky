import { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react'
import { useEditorState } from './useEditorState'
import { useEditorShortcuts } from './useEditorShortcuts'
import { ContentEditorToolbar } from './ContentEditorToolbar'
import { normalizeEditorHTML } from './normalizeHTML'

export interface ContentEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export interface ContentEditorRef {
  getHTML: () => string
  setHTML: (html: string) => void
  clear: () => void
  focus: () => void
}

export const ContentEditor = forwardRef<ContentEditorRef, ContentEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Type here…',
  autoFocus = false,
  className = '',
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [linkMode, setLinkMode] = useState(false)
  const savedRangeRef = useRef<Range | null>(null)
  const isInitialMount = useRef(true)
  // The last HTML we emitted via onChange. The controlled value echoes back as this
  // exact string; writing it to innerHTML would collapse the live selection, so we
  // skip the echo and only overwrite the DOM for genuinely external value changes.
  const lastEmittedRef = useRef(value)

  const formatState = useEditorState(editorRef)

  useImperativeHandle(ref, () => ({
    getHTML: () => normalizeEditorHTML(editorRef.current?.innerHTML ?? ''),
    setHTML: (html) => { if (editorRef.current) editorRef.current.innerHTML = html },
    clear: () => { if (editorRef.current) editorRef.current.innerHTML = '' },
    focus: () => editorRef.current?.focus(),
  }))

  // Use <p> as the default paragraph separator (not <div>)
  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'p')
  }, [])

  // Sync value prop → editor DOM
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (editorRef.current && value) editorRef.current.innerHTML = value
      if (autoFocus) editorRef.current?.focus()
      return
    }
    // Echo of our own onChange (e.g. right after a formatting command) — leave the
    // DOM and its selection alone. Only an external change overwrites the editor.
    if (value === lastEmittedRef.current) return
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleLinkRequest = () => {
    // Use shadow root's getSelection() so the range points into the shadow tree,
    // not the adjusted outer-document range window.getSelection() returns for shadow DOM content.
    const root = editorRef.current?.getRootNode() as any
    const sel: Selection | null = root?.getSelection?.() ?? window.getSelection()
    if (sel?.rangeCount) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
    setLinkMode(true)
  }

  useEditorShortcuts(editorRef, formatState, handleLinkRequest)

  return (
    <div className={`content-editor vertical ground-subtle ${className}`}>
      <ContentEditorToolbar
        formatState={formatState}
        linkMode={linkMode}
        savedRange={savedRangeRef.current}
        editorRef={editorRef}
        onLinkRequest={handleLinkRequest}
        onLinkClose={() => { setLinkMode(false); editorRef.current?.focus() }}
      />
      <div
        ref={editorRef}
        contentEditable
        className="content-editor-body padding-comfortable ink font-md corner-lg rule"
        data-placeholder={placeholder}
        onInput={() => {
          if (!editorRef.current || !onChange) return
          const html = normalizeEditorHTML(editorRef.current.innerHTML)
          lastEmittedRef.current = html
          onChange(html)
        }}
      />
    </div>
  )
})

ContentEditor.displayName = 'ContentEditor'
