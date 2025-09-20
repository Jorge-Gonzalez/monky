import type { Macro } from "./detector-core"

export type EditableEl = HTMLInputElement | HTMLTextAreaElement | HTMLElement | null

export function getActiveEditable(target: EventTarget | null): EditableEl {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    if (target.type === "password") return null
    return target
  }
  if (target instanceof HTMLElement && (target.isContentEditable || target.contentEditable === "true")) {
    return target
  }
  return null
}

/**
 * Given a root node and a character offset, finds the text node and offset within
 * that text node that corresponds to the character offset.
 */
function findTextNodeForOffset(root: Node, offset: number): { node: Text; offsetInNode: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  let currentNode: Node | null = walker.nextNode()
  let accumulatedOffset = 0
  while (currentNode) {
    const nodeLength = (currentNode.textContent || "").length
    if (accumulatedOffset + nodeLength >= offset) {
      return { node: currentNode as Text, offsetInNode: offset - accumulatedOffset }
    }
    accumulatedOffset += nodeLength
    currentNode = walker.nextNode()
  }
  return null
}

/**
 * Calculates the absolute character offset of a selection point (container + offset)
 * within a root node.
 */
function getAbsoluteOffset(root: Node, container: Node, offsetInContainer: number): number {
  const range = document.createRange()
  range.selectNodeContents(root)
  // This can throw an error if the container is not a descendant of the root.
  // It's a programmer error if that happens, so we'll let it throw.
  range.setEnd(container, offsetInContainer)
  return range.toString().length
}

export function getSelection(el: EditableEl): { start: number; end: number } | null {
  if (!el) return null
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 }
  }
  if (el instanceof HTMLElement && (el.isContentEditable || el.contentEditable === "true")) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    const start = getAbsoluteOffset(el, range.startContainer, range.startOffset)
    const end = getAbsoluteOffset(el, range.endContainer, range.endOffset)
    return { start, end }
  }
  return null
}

/**
 * Replaces text and sets the cursor in an <input> or <textarea> element.
 */
function replaceTextInInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  macro: Macro,
  startPos: number,
  selEnd: number,
) {
  const value = el.value
  const before = value.slice(0, startPos)
  const after = value.slice(selEnd)
  el.value = before + macro.text + after

  const caretPosition = before.length + macro.text.length
  el.setSelectionRange(caretPosition, caretPosition)
}

/**
 * Sets the cursor position to be right after the given node.
 */
function setCursorAfterNode(node: Node) {
  const selection = window.getSelection()
  if (!selection) return

  selection.removeAllRanges()
  const range = document.createRange()
  range.setStartAfter(node)
  range.collapse(true)
  selection.addRange(range)
}

/**
 * Sets the cursor position in a contenteditable element at a given absolute character offset.
 */
function setCursorAtOffset(root: Node, offset: number) {
  const selection = window.getSelection()
  if (!selection) return

  const target = findTextNodeForOffset(root, offset)
  if (target) {
    selection.removeAllRanges()
    const range = document.createRange()
    range.setStart(target.node, target.offsetInNode)
    range.collapse(true)
    selection.addRange(range)
  }
}

/**
 * Replaces text in a contenteditable element using various strategies.
 */
function replaceTextInContentEditable(el: HTMLElement, macro: Macro, startPos: number, selEnd: number) {
  // Strategy 1: Fast path for elements with a single text node.
  const firstChild = el.firstChild
  if (firstChild && firstChild.nodeType === Node.TEXT_NODE && el.childNodes.length === 1) {
    const textNode = firstChild as Text
    const before = textNode.data.slice(0, startPos)
    const after = textNode.data.slice(selEnd)
    textNode.data = before + macro.text + after
    setCursorAtOffset(el, before.length + macro.text.length)
    return
  }

  // Strategy 2: DOM-aware replacement for complex HTML structures.
  const start = findTextNodeForOffset(el, startPos)
  const end = findTextNodeForOffset(el, selEnd)

  if (start && end) {
    const range = document.createRange()
    range.setStart(start.node, start.offsetInNode)
    range.setEnd(end.node, end.offsetInNode)

    // If the end of the range is at the very end of a text node,
    // and that text node is the only child of its parent,
    // expand the range to include the parent element itself.
    // This helps delete tags like <i>cro</i> instead of just leaving <i></i>.
    if (
      end.offsetInNode === end.node.length &&
      end.node.parentNode &&
      end.node.parentNode !== el &&
      end.node.parentNode.childNodes.length === 1
    ) {
      range.setEndAfter(end.node.parentNode)
    }

    range.deleteContents()

    const insertedNode = document.createTextNode(macro.text)
    range.insertNode(insertedNode)
    setCursorAfterNode(insertedNode)
    return
  }

  // Strategy 3: Fallback using execCommand.
  // This is a last resort if the DOM-aware logic fails.
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    // We can't trust startPos if findTextNodeForOffset failed,
    // so we re-select based on the current cursor position and command length.
    const commandLength = selEnd - startPos
    range.setStart(range.endContainer, range.endOffset - commandLength)
    range.deleteContents()
    // execCommand is simpler than insertNode for this fallback case.
    document.execCommand("insertText", false, macro.text)
  }
}

/**
 * Replaces a range of text in an editable element with the text from a macro.
 * It handles <input>, <textarea>, and contenteditable elements.
 */
export function replaceText(el: EditableEl, macro: Macro, startPos: number, selEnd: number) {
  if (!el) return

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    replaceTextInInput(el, macro, startPos, selEnd)
  } else if (el instanceof HTMLElement && (el.isContentEditable || el.contentEditable === "true")) {
    replaceTextInContentEditable(el, macro, startPos, selEnd)
  }

  // All paths should dispatch an input event to notify listeners of the change.
  el.dispatchEvent(new Event("input", { bubbles: true }))
}