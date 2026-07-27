import type { RefObject} from 'react'
import { useEffect, useRef } from 'react'
import type { EditorFormatState, BlockType } from './types'
import {
  toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough,
  toggleInlineCode, toggleBulletList, toggleOrderedList, setBlockType,
  undo, redo,
} from './editorCommands'

type MarkdownTrigger = {
  pattern: RegExp
  apply: (blockType: BlockType) => void
}

const MARKDOWN_TRIGGERS: MarkdownTrigger[] = [
  { pattern: /^[*-]$/, apply: () => toggleBulletList() },
  { pattern: /^1\.$/, apply: () => toggleOrderedList() },
  // Check ### before ## before # so longer patterns match first
  { pattern: /^###$/, apply: (b) => setBlockType(b === 'h3' ? 'paragraph' : 'h3') },
  { pattern: /^##$/, apply: (b) => setBlockType(b === 'h2' ? 'paragraph' : 'h2') },
  { pattern: /^#$/, apply: (b) => setBlockType(b === 'h1' ? 'paragraph' : 'h1') },
  { pattern: /^>$/, apply: (b) => setBlockType(b === 'blockquote' ? 'paragraph' : 'blockquote') },
  { pattern: /^```$/, apply: (b) => setBlockType(b === 'pre' ? 'paragraph' : 'pre') },
]

function getLineTextBeforeCursor(editorEl: HTMLElement): string {
  const sel = window.getSelection()
  if (!sel?.rangeCount || !sel.anchorNode) return ''

  let block: Node | null = sel.anchorNode
  while (block && block !== editorEl) {
    if (block.nodeType === Node.ELEMENT_NODE) {
      const tag = (block as Element).tagName.toLowerCase()
      if (['p', 'div', 'li', 'h1', 'h2', 'h3', 'blockquote', 'pre'].includes(tag)) break
    }
    block = block.parentNode
  }
  if (!block || block === editorEl) return ''

  try {
    const range = sel.getRangeAt(0).cloneRange()
    range.setStart(block, 0)
    range.setEnd(sel.anchorNode, sel.anchorOffset)
    return range.toString()
  } catch {
    return ''
  }
}

function deleteTriggerText(editorEl: HTMLElement) {
  const sel = window.getSelection()
  if (!sel?.rangeCount || !sel.anchorNode) return

  let block: Node | null = sel.anchorNode
  while (block && block !== editorEl) {
    if (block.nodeType === Node.ELEMENT_NODE) {
      const tag = (block as Element).tagName.toLowerCase()
      if (['p', 'div', 'li', 'h1', 'h2', 'h3', 'blockquote', 'pre'].includes(tag)) break
    }
    block = block.parentNode
  }
  if (!block || block === editorEl) return

  try {
    const range = document.createRange()
    range.setStart(block, 0)
    range.setEnd(sel.anchorNode, sel.anchorOffset)
    sel.removeAllRanges()
    sel.addRange(range)
    document.execCommand('delete')
  } catch { /* ignore */ }
}

export function useEditorShortcuts(
  editorRef: RefObject<HTMLDivElement>,
  formatState: EditorFormatState,
  onLinkRequest: () => void,
) {
  // Use refs so the keydown listener never needs to be re-registered
  const stateRef = useRef(formatState)
  const linkRequestRef = useRef(onLinkRequest)
  useEffect(() => { stateRef.current = formatState }, [formatState])
  useEffect(() => { linkRequestRef.current = onLinkRequest }, [onLinkRequest])

  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      const { blockType } = stateRef.current

      if (ctrl && !e.altKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); return }
        if (e.key === 'b') { e.preventDefault(); toggleBold(); return }
        if (e.key === 'i') { e.preventDefault(); toggleItalic(); return }
        if (e.key === 'u') { e.preventDefault(); toggleUnderline(); return }
        if (e.key === 'e') { e.preventDefault(); toggleInlineCode(); return }
        if (e.key === 'k') { e.preventDefault(); linkRequestRef.current(); return }
        if (e.shiftKey) {
          if (e.key === 'X' || e.key === 'x') { e.preventDefault(); toggleStrikethrough(); return }
          if (e.key === '8' || e.key === '*') { e.preventDefault(); toggleBulletList(); return }
          if (e.key === '7' || e.key === '&') { e.preventDefault(); toggleOrderedList(); return }
          if (e.key === '9' || e.key === '(') {
            e.preventDefault()
            setBlockType(blockType === 'blockquote' ? 'paragraph' : 'blockquote')
            return
          }
        }
      }

      if (ctrl && e.altKey) {
        if (e.key === '1') { e.preventDefault(); setBlockType(blockType === 'h1' ? 'paragraph' : 'h1'); return }
        if (e.key === '2') { e.preventDefault(); setBlockType(blockType === 'h2' ? 'paragraph' : 'h2'); return }
        if (e.key === '3') { e.preventDefault(); setBlockType(blockType === 'h3' ? 'paragraph' : 'h3'); return }
        if (e.key === '6') { e.preventDefault(); setBlockType(blockType === 'pre' ? 'paragraph' : 'pre'); return }
      }

      // Markdown triggers on Space
      if (e.key === ' ' && !ctrl && !e.altKey && !e.shiftKey) {
        const text = getLineTextBeforeCursor(el)
        const trigger = MARKDOWN_TRIGGERS.find(t => t.pattern.test(text))
        if (trigger) {
          e.preventDefault()
          deleteTriggerText(el)
          trigger.apply(blockType)
        }
      }
    }

    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [editorRef])
}
