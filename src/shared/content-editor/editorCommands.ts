import type { BlockType } from './types'

export function toggleBold() { document.execCommand('bold') }
export function toggleItalic() { document.execCommand('italic') }
export function toggleUnderline() { document.execCommand('underline') }
export function toggleStrikethrough() { document.execCommand('strikeThrough') }
export function toggleBulletList() { document.execCommand('insertUnorderedList') }
export function toggleOrderedList() { document.execCommand('insertOrderedList') }
export function undo() { document.execCommand('undo') }
export function redo() { document.execCommand('redo') }

export function setBlockType(type: BlockType) {
  const tag = type === 'paragraph' ? 'p' : type
  document.execCommand('formatBlock', false, tag)
}

export function insertLink(url: string, savedRange?: Range) {
  const range = savedRange ?? window.getSelection()?.getRangeAt(0)
  if (!range) return

  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'

  if (range.collapsed) {
    a.textContent = url
    range.insertNode(a)
  } else {
    try {
      range.surroundContents(a)
    } catch {
      // Cross-element selection: extract and rewrap
      a.appendChild(range.extractContents())
      range.insertNode(a)
    }
  }
}

export function removeLink(savedRange?: Range) {
  // Walk up from savedRange's start container to find the enclosing anchor
  let node: Node | null = savedRange?.startContainer ?? window.getSelection()?.anchorNode ?? null
  while (node) {
    if (node.nodeName === 'A') {
      const a = node as HTMLElement
      const parent = a.parentNode!
      while (a.firstChild) parent.insertBefore(a.firstChild, a)
      parent.removeChild(a)
      return
    }
    if ((node as HTMLElement).isContentEditable) break
    node = node.parentNode
  }
  document.execCommand('unlink')
}

export function toggleInlineCode() {
  const sel = window.getSelection()
  if (!sel?.rangeCount) return
  const range = sel.getRangeAt(0)

  // Walk up to find an enclosing <code>, stopping at contenteditable boundary
  let node: Node | null = sel.anchorNode
  while (node) {
    if (node.nodeName === 'CODE') {
      const code = node as HTMLElement
      const parent = code.parentNode!
      while (code.firstChild) parent.insertBefore(code.firstChild, code)
      parent.removeChild(code)
      return
    }
    if ((node as HTMLElement).isContentEditable) break
    node = node.parentNode
  }

  try {
    const code = document.createElement('code')
    range.surroundContents(code)
  } catch {
    // surroundContents fails for cross-element selections — skip silently
  }
}
