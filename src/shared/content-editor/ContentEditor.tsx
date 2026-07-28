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

export const ContentEditor = forwardRef<ContentEditorRef, ContentEditorProps>(
  ({ value = '', onChange, placeholder = 'Type here…', autoFocus = false, className = '' }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const [linkMode, setLinkMode] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const savedRangeRef = useRef<Range | null>(null)
    const isInitialMount = useRef(true)
    // The last HTML we emitted via onChange. The controlled value echoes back as this
    // exact string; writing it to innerHTML would collapse the live selection, so we
    // skip the echo and only overwrite the DOM for genuinely external value changes.
    const lastEmittedRef = useRef(value)

    const formatState = useEditorState(editorRef)

    useImperativeHandle(ref, () => ({
      getHTML: () => normalizeEditorHTML(editorRef.current?.innerHTML ?? ''),
      setHTML: (html) => {
        if (editorRef.current) editorRef.current.innerHTML = html
      },
      clear: () => {
        if (editorRef.current) editorRef.current.innerHTML = ''
      },
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
    }, [value, autoFocus])

    const handleLinkRequest = () => {
      // Use shadow root's getSelection() so the range points into the shadow tree,
      // not the adjusted outer-document range window.getSelection() returns for shadow DOM content.
      // getSelection() on a ShadowRoot is non-standard, so it is declared optional here.
      const root = editorRef.current?.getRootNode() as
        | (Node & { getSelection?: () => Selection | null })
        | undefined
      const sel: Selection | null = root?.getSelection?.() ?? window.getSelection()
      if (sel?.rangeCount) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange()
      }
      setLinkMode(true)
    }

    useEditorShortcuts(editorRef, formatState, handleLinkRequest)
    const collapseMinHeight = className.includes('min-height-none')
    const shellMinHeight = collapseMinHeight ? '' : ' min-height-editor'
    const bodyMinHeight = collapseMinHeight ? 'min-height-none' : 'min-height-editor'
    const bodyFlex = className.includes('editor-content') ? 'elastic basis-ratio ' : ''

    return (
      <div
        data-component="ce-shell"
        className={`vertical ${shellMinHeight} ${className}`}
      >
        <ContentEditorToolbar
          formatState={formatState}
          linkMode={linkMode}
          savedRange={savedRangeRef.current}
          editorRef={editorRef}
          onLinkRequest={handleLinkRequest}
          onLinkClose={() => {
            setLinkMode(false)
            editorRef.current?.focus()
          }}
        />
        <div
          data-component="ce-frame"
          className={`vertical hidden ${bodyFlex}${bodyMinHeight} ground-subtle ink ${isFocused ? 'rule-accent-soft ring-accent-soft' : 'rule'} corner-xl ruled recessed-soft`}
        >
          <div
            ref={editorRef}
            contentEditable
            data-component="ce-body"
            className="sf-authored-content sf-generated-placeholder sf-focus-proxy
              elastic basis-ratio padding-top-md padding-bottom-md padding-left-md padding-right-xl margin-right-xs scroll-auto min-height-none
              ground-subtle ink font-md"
            data-placeholder={placeholder}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onInput={() => {
              if (!editorRef.current || !onChange) return
              const html = normalizeEditorHTML(editorRef.current.innerHTML)
              lastEmittedRef.current = html
              onChange(html)
            }}
          />
        </div>
      </div>
    )
  }
)

ContentEditor.displayName = 'ContentEditor'
