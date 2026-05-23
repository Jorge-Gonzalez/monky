import { useState, useEffect, RefObject } from 'react'
import { BlockType, EditorFormatState, DEFAULT_FORMAT_STATE } from './types'

function getBlockType(): BlockType {
  const sel = window.getSelection()
  if (!sel?.anchorNode) return 'paragraph'
  let node: Node | null = sel.anchorNode
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName.toLowerCase()
      if (tag === 'h1') return 'h1'
      if (tag === 'h2') return 'h2'
      if (tag === 'h3') return 'h3'
      if (tag === 'blockquote') return 'blockquote'
      if (tag === 'pre') return 'pre'
      if ((node as HTMLElement).isContentEditable) break
    }
    node = node.parentNode
  }
  return 'paragraph'
}

function getLinkHref(): string | null {
  const sel = window.getSelection()
  if (!sel?.anchorNode) return null
  let node: Node | null = sel.anchorNode
  while (node) {
    if (node.nodeName === 'A') return (node as HTMLAnchorElement).getAttribute('href')
    if ((node as HTMLElement).isContentEditable) break
    node = node.parentNode
  }
  return null
}

function isInsideCode(): boolean {
  const sel = window.getSelection()
  if (!sel?.anchorNode) return false
  let node: Node | null = sel.anchorNode
  while (node) {
    if (node.nodeName === 'CODE') return true
    if ((node as HTMLElement).isContentEditable) break
    node = node.parentNode
  }
  return false
}

function queryState(): EditorFormatState {
  const sel = window.getSelection()
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    strikethrough: document.queryCommandState('strikeThrough'),
    inlineCode: isInsideCode(),
    bulletList: document.queryCommandState('insertUnorderedList'),
    orderedList: document.queryCommandState('insertOrderedList'),
    blockType: getBlockType(),
    linkHref: getLinkHref(),
    hasSelection: sel ? !sel.isCollapsed : false,
  }
}

export function useEditorState(editorRef: RefObject<HTMLDivElement>): EditorFormatState {
  const [state, setState] = useState<EditorFormatState>(DEFAULT_FORMAT_STATE)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    const update = () => {
      const sel = window.getSelection()
      if (!sel?.anchorNode || !el.contains(sel.anchorNode)) return
      setState(queryState())
    }

    document.addEventListener('selectionchange', update)
    el.addEventListener('input', update)
    return () => {
      document.removeEventListener('selectionchange', update)
      el.removeEventListener('input', update)
    }
  }, [editorRef])

  return state
}
