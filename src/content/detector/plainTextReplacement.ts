import { findTextNodeForOffset, setCursorAtOffset } from './editableUtils'

/**
 * Plain text replacement module for contenteditable elements.
 * Handles text-only replacements without HTML formatting.
 * For HTML content, use richTextReplacement.ts instead.
 */

/**
 * Helper function to set cursor after a node
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
 * Replaces text in a contenteditable element with plain text.
 * Uses DOM-aware strategies to preserve existing HTML structure.
 *
 * @param element - The contenteditable element
 * @param startPos - Start position in textContent
 * @param endPos - End position in textContent
 * @param replacementText - Plain text to insert
 * @returns true if replacement succeeded, false otherwise
 */
export function replacePlainText(
  element: HTMLElement,
  startPos: number,
  endPos: number,
  replacementText: string
): boolean {
  if (!element || (!element.isContentEditable && element.contentEditable !== 'true')) {
    return false
  }

  // Strategy 1: Fast path for elements with a single text node
  const firstChild = element.firstChild
  if (firstChild && firstChild.nodeType === Node.TEXT_NODE && element.childNodes.length === 1) {
    const textNode = firstChild as Text
    const before = textNode.data.slice(0, startPos)
    const after = textNode.data.slice(endPos)

    textNode.data = before + replacementText + after
    setCursorAtOffset(element, before.length + replacementText.length)
    return true
  }

  // Strategy 2: DOM-aware replacement for complex HTML structures
  const start = findTextNodeForOffset(element, startPos)
  const end = findTextNodeForOffset(element, endPos)

  if (!start || !end) {
    console.error('[PlainTextReplacement] Could not find text nodes at positions', startPos, endPos)
    return false
  }

  try {
    // Special handling for replacement within a single text node
    if (start.node === end.node) {
      const textNode = start.node
      const beforeText = textNode.data.substring(0, start.offsetInNode)
      const afterText = textNode.data.substring(end.offsetInNode)

      textNode.data = beforeText + replacementText + afterText
      setCursorAtOffset(element, startPos + replacementText.length)
      return true
    }

    // Special case: end is at position 0 of next node (selection ends exactly at node boundary)
    if (start.node !== end.node && end.offsetInNode === 0) {
      const textNode = start.node
      const parent = textNode.parentNode
      const beforeText = textNode.data.substring(0, start.offsetInNode)

      if (parent) {
        const newText = beforeText + replacementText
        const newTextNode = document.createTextNode(newText)
        parent.insertBefore(newTextNode, textNode)
        parent.removeChild(textNode)
        setCursorAtOffset(element, startPos + replacementText.length)
        return true
      }
    }

    // Multi-node replacement: use range-based approach
    const range = document.createRange()
    range.setStart(start.node, start.offsetInNode)
    range.setEnd(end.node, end.offsetInNode)

    // If the selection spans the entire content of a parent element,
    // expand the range to include that parent to clean up empty tags
    if (start.offsetInNode === 0 && start.node.parentNode &&
        start.node.parentNode !== element &&
        start.node.parentNode.childNodes.length === 1) {
      range.setStartBefore(start.node.parentNode)
    }

    if (end.offsetInNode === end.node.length && end.node.parentNode &&
        end.node.parentNode !== element &&
        end.node.parentNode.childNodes.length === 1) {
      range.setEndAfter(end.node.parentNode)
    }

    range.deleteContents()

    // Insert plain text
    const insertedNode = document.createTextNode(replacementText)
    range.insertNode(insertedNode)
    setCursorAfterNode(insertedNode)

    return true
  } catch (error) {
    console.error('[PlainTextReplacement] Error during replacement:', error)
    return false
  }
}

/**
 * Fallback replacement using execCommand (deprecated but reliable fallback)
 * Only use this if DOM-aware replacement fails.
 */
export function replacePlainTextFallback(
  element: HTMLElement,
  startPos: number,
  endPos: number,
  replacementText: string
): boolean {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  try {
    const range = selection.getRangeAt(0)
    const commandLength = endPos - startPos

    // Try to select the text to replace based on current cursor position
    range.setStart(range.endContainer, range.endOffset - commandLength)
    range.deleteContents()

    // Use execCommand as fallback
    document.execCommand('insertText', false, replacementText)
    return true
  } catch (error) {
    console.error('[PlainTextReplacement] Fallback failed:', error)
    return false
  }
}
