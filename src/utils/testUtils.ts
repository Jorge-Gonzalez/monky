import type { EditableEl } from '../types'

/**
 * Helper function to simulate typing in an element
 * Dispatches keydown events and updates content ONLY if preventDefault wasn't called
 * This properly simulates browser behavior where content updates are the "default action"
 *
 * Special character handling:
 * - '\n' in string is converted to 'Enter' key press
 * - 'Enter' in contentEditable creates <br> tags (real browser behavior)
 * - 'Enter' in textarea creates '\n' characters
 */
export function typeIn(element: EditableEl, str: string) {
  element.focus()

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    // Convert \n to Enter key for natural syntax
    const key = char === '\n' ? 'Enter' : char

    // Dispatch keydown event FIRST
    const keydownEvent = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true, // IMPORTANT: must be cancelable for preventDefault to work
    })

    const wasDefaultPrevented = !element.dispatchEvent(keydownEvent)

    // Only update content if preventDefault was NOT called
    // This simulates the browser's default behavior
    if (!wasDefaultPrevented) {
      updateElementContent(element, key)
    }
  }

  // Dispatch input event at the end (if any content was added)
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
}

/**
 * Updates element content with a character
 * This simulates the browser's default action for a keypress
 */
function updateElementContent(element: EditableEl, key: string) {
  if (element.isContentEditable || (element as HTMLElement).contentEditable === 'true') {
    let selection = window.getSelection()
    let range: Range

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0)
    } else {
      // No selection exists, create one at the end
      selection = window.getSelection()!
      range = document.createRange()

      // Find the last position in the contentEditable
      if (element.childNodes.length > 0) {
        const lastNode = element.childNodes[element.childNodes.length - 1]
        if (lastNode.nodeType === Node.TEXT_NODE) {
          range.setStart(lastNode, (lastNode as Text).length)
        } else {
          range.setStartAfter(lastNode)
        }
      } else {
        range.setStart(element, 0)
      }
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    // Delete any selected content
    range.deleteContents()

    // Insert the new character (or handle special keys)
    if (key === 'Enter') {
      // Real browser behavior: Insert <br> in contentEditable
      // (Some browsers use <div>, but <br> is more universal and what most rich text editors use)
      const br = document.createElement('br')
      range.insertNode(br)
      range.setStartAfter(br)

      // Add a second <br> if we're at the end of content
      // This ensures the cursor moves to a new visible line
      const isAtEnd =
        !range.startContainer.nextSibling &&
        range.startOffset === (range.startContainer.textContent?.length || 0)
      if (isAtEnd) {
        const br2 = document.createElement('br')
        range.insertNode(br2)
        range.setStartAfter(br2)
      }
    } else if (key === ' ') {
      // Insert space as text node
      const textNode = document.createTextNode(' ')
      range.insertNode(textNode)
      range.setStartAfter(textNode)
    } else if (key.length === 1) {
      // Regular character
      const textNode = document.createTextNode(key)
      range.insertNode(textNode)
      range.setStartAfter(textNode)
    }
    // Ignore special keys like 'Escape', 'Tab', 'ArrowUp', etc.

    // Update cursor position
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // For input/textarea, manipulate value and selection
    const start = element.selectionStart || 0
    const end = element.selectionEnd || 0

    if (key === 'Enter' && element instanceof HTMLTextAreaElement) {
      // Textarea: Enter creates actual newline character
      element.value = element.value.substring(0, start) + '\n' + element.value.substring(end)
      element.selectionStart = element.selectionEnd = start + 1
    } else if (key === 'Enter' && element instanceof HTMLInputElement) {
      // Input: Enter is typically ignored or submits form (we'll ignore it)
      // Do nothing - browsers don't add newlines to single-line inputs
    } else if (key === ' ') {
      element.value = element.value.substring(0, start) + ' ' + element.value.substring(end)
      element.selectionStart = element.selectionEnd = start + 1
    } else if (key.length === 1) {
      element.value = element.value.substring(0, start) + key + element.value.substring(end)
      element.selectionStart = element.selectionEnd = start + 1
    }
    // Ignore other special keys
  }
}

/**
 * Alternative helper for tests that need to verify preventDefault behavior
 * Returns whether the default was prevented for each character
 */
export function typeInWithResult(element: EditableEl, str: string): boolean[] {
  element.focus()
  const results: boolean[] = []

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const key = char === '\n' ? 'Enter' : char

    const keydownEvent = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    })

    const wasDefaultPrevented = !element.dispatchEvent(keydownEvent)
    results.push(wasDefaultPrevented)

    if (!wasDefaultPrevented) {
      updateElementContent(element, key)
    }
  }

  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  return results
}

/**
 * Helper to position cursor at a specific location in contentEditable
 */
export function setCursorPosition(
  element: EditableEl,
  position: 'start' | 'end' | 'after-element',
  targetElement?: HTMLElement
) {
  if (!element.isContentEditable && (element as HTMLElement).contentEditable !== 'true') {
    // For input/textarea
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      if (position === 'start') {
        element.setSelectionRange(0, 0)
      } else if (position === 'end') {
        element.setSelectionRange(element.value.length, element.value.length)
      }
    }
    return
  }

  const selection = window.getSelection()!
  const range = document.createRange()

  if (position === 'start') {
    range.setStart(element, 0)
    range.collapse(true)
  } else if (position === 'end') {
    // Position after the last node
    if (element.childNodes.length > 0) {
      const lastNode = element.childNodes[element.childNodes.length - 1]
      if (lastNode.nodeType === Node.TEXT_NODE) {
        range.setStart(lastNode, (lastNode as Text).length)
      } else {
        range.setStartAfter(lastNode)
      }
    } else {
      range.setStart(element, 0)
    }
    range.collapse(true)
  } else if (position === 'after-element' && targetElement) {
    // Position after a specific element
    range.setStartAfter(targetElement)
    range.collapse(true)
  }

  selection.removeAllRanges()
  selection.addRange(range)
}

/**
 * Helper to position cursor inside an element
 */
export function setCursorInside(element: HTMLElement, offset: number = 0) {
  const selection = window.getSelection()!
  const range = document.createRange()

  if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
    // Position inside text node
    range.setStart(element.firstChild, Math.min(offset, (element.firstChild as Text).length))
  } else {
    // Position inside element
    range.setStart(element, offset)
  }

  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}
