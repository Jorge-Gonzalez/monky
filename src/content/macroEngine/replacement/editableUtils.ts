import type { EditableEl } from '../../../types'

export function getActiveEditable(target: EventTarget | null): EditableEl {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    if (target.type === "password") return null
    return target
  }

  // For contenteditable elements, we need to traverse up the DOM tree
  // because the target might be a child element (text node, <b>, <i>, etc.)
  let element: HTMLElement | null = null;

  if (target instanceof HTMLElement) {
    element = target;
  } else if (target instanceof Node && target.parentElement) {
    // Handle text nodes and other non-HTMLElement nodes
    element = target.parentElement;
  }

  while (element) {
    if (element.isContentEditable || element.contentEditable === "true") {
      return element;
    }
    element = element.parentElement;
  }

  return null
}

/**
 * Extract text content from an editable element
 */
export function getTextContent(element: EditableEl): string {
  if (!element) return ''

  if ('value' in element) {
    return element.value
  } else if ('textContent' in element) {
    return element.textContent || ''
  }
  return ''
}

/**
 * Given a root node and a character offset, finds the text node and offset within
 * that text node that corresponds to the character offset.
 */
export function findTextNodeForOffset(root: Node, offset: number): { node: Text; offsetInNode: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  let currentNode: Node | null = walker.nextNode()
  let accumulatedOffset = 0
  while (currentNode) {
    const nodeLength = (currentNode.textContent ?? "").length
    if (accumulatedOffset + nodeLength >= offset) {
      const offsetInNode = offset - accumulatedOffset
      // If we are at the very end of a text node, and there's a next text node,
      // it's more accurate to return the beginning of the next node. This handles
      // cases where the selection starts exactly between two nodes.
      if (offsetInNode === nodeLength) {
        const nextNode = walker.nextNode()
        if (nextNode) return { node: nextNode as Text, offsetInNode: 0 }
      }
      return { node: currentNode as Text, offsetInNode }
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
 * Gets the screen coordinates of the current cursor/caret position.
 * @returns An object with x and y coordinates, or null if not determinable.
 */
export function getCursorCoordinates(): { x: number; y: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0).cloneRange();
  // Collapse the range to the start, which is the caret position
  range.collapse(true);

  try {
    const rects = range.getClientRects();
    if (rects.length > 0) {
      const rect = rects[0];
      return { x: rect.left, y: rect.bottom }; // Use bottom to position popup below the line
    }
  } catch (error) {
    // In test environments (JSDOM), getClientRects might not be properly implemented
    // Fall through to the activeElement fallback
  }

  // Fallback for elements where getClientRects() might fail for a collapsed range
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement) {
    try {
      const rect = activeElement.getBoundingClientRect();
      return { x: rect.left, y: rect.bottom };
    } catch (error) {
      // In test environments, return a default position
      return { x: 0, y: 0 };
    }
  }

  return null;
}

/**
 * Sets the cursor position in a contenteditable element at a given absolute character offset.
 */
export function setCursorAtOffset(root: Node, offset: number) {
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
 * Normalizes text for input elements by removing newlines and collapsing whitespace.
 * This duplicates the logic from inputTextReplacement.ts to determine what text
 * will actually be inserted into the input element.
 *
 * Note: We preserve leading/trailing spaces intentionally - they may be meaningful
 * in the replacement text.
 */
export function normalizeForInputElement(text: string): string {
  return text.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ')
}
