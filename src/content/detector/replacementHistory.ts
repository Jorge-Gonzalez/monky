import { EditableEl } from "../../types"
import { getTextContent, findTextNodeForOffset, setCursorAtOffset } from "./editableUtils"
import { undoMostRecentInsertion, hasMarkers } from "./richTextReplacement"

// History entry tracking a specific text replacement
export interface ReplacementHistoryEntry {
  elementId: string
  element: WeakRef<EditableEl>
  startPos: number
  endPos: number
  originalText: string
  replacementText: string
  timestamp: number
}

const MAX_HISTORY_SIZE = 50

/**
 * Creates a replacement history manager for undo functionality.
 * Uses position-based approach: stores the positions and text snippets
 * to allow undoing specific replacements even if surrounding text changes.
 */
export function createReplacementHistory() {
  const history: ReplacementHistoryEntry[] = []
  const elementIdMap = new WeakMap<EditableEl, string>()
  let counter = 0

  /**
   * Generate or get unique ID for element
   */
  function getElementId(element: EditableEl): string {
    if (!elementIdMap.has(element)) {
      const id = `element_${counter++}`
      elementIdMap.set(element, id)
    }
    return elementIdMap.get(element)!
  }

  /**
   * Create a Range object from text positions in a contentEditable element
   */
  function createRangeFromTextPositions(
    element: EditableEl,
    startPos: number,
    endPos: number
  ): Range | null {
    if (!element) return null

    const start = findTextNodeForOffset(element as Node, startPos)
    const end = findTextNodeForOffset(element as Node, endPos)

    if (!start || !end) return null

    try {
      const range = document.createRange()
      range.setStart(start.node, start.offsetInNode)
      range.setEnd(end.node, end.offsetInNode)
      return range
    } catch (error) {
      console.error('Error creating range:', error)
      return null
    }
  }

  /**
   * Replace text in contentEditable while preserving HTML formatting
   */
  function replaceInContentEditablePreservingFormat(
    element: EditableEl,
    startPos: number,
    endPos: number,
    replacementText: string
  ): void {
    const selection = window.getSelection()
    if (!selection) return

    // Find the text node(s) that contain our target range
    const range = createRangeFromTextPositions(element, startPos, endPos)
    if (!range) return

    // Select the range
    selection.removeAllRanges()
    selection.addRange(range)

    // Delete the selected content
    range.deleteContents()

    // Insert the replacement text as a text node
    const textNode = document.createTextNode(replacementText)
    range.insertNode(textNode)

    // Move cursor after the inserted text
    range.setStartAfter(textNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  /**
   * Set cursor position in the element
   */
  function setCursorPosition(element: EditableEl, position: number): void {
    if (!element) return

    if ('setSelectionRange' in element) {
      element.focus()
      element.setSelectionRange(position, position)
    } else if (element.isContentEditable) {
      setCursorAtOffset(element as Node, position)
    }
  }

  /**
   * Create a history entry for a replacement
   */
  function createEntry(
    element: EditableEl,
    startPos: number,
    endPos: number,
    originalText: string,
    replacementText: string
  ): void {
    if (!element) return

    const elementId = getElementId(element)

    history.push({
      elementId,
      element: new WeakRef(element),
      startPos,
      endPos,
      originalText,
      replacementText,
      timestamp: Date.now()
    })

    // Keep history size manageable
    if (history.length > MAX_HISTORY_SIZE) {
      history.shift()
    }
  }

  /**
   * Undo the last replacement for a specific element
   */
  function undo(activeElement: EditableEl): boolean {
    if (!activeElement) return false

    // Check if element has markers (HTML insertions)
    // If so, try marker-based undo first
    if (hasMarkers(activeElement)) {
      const success = undoMostRecentInsertion(activeElement)
      if (success) {
        // Marker undo succeeded, dispatch input event
        activeElement.dispatchEvent(new Event('input', { bubbles: true }))
        return true
      }
      // If marker undo failed, fall through to position-based undo
    }

    const elementId = getElementId(activeElement)

    // Find the last entry for this element
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i]

      if (entry.elementId === elementId) {
        const element = entry.element.deref()

        // Element was garbage collected
        if (!element || !document.contains(element as Node)) {
          history.splice(i, 1)
          return false
        }

        const currentContent = getTextContent(element)
        const { startPos, originalText, replacementText } = entry

        // Calculate where the replacement should be in current content
        const expectedReplacementPos = startPos
        const expectedEndPos = startPos + replacementText.length

        // Verify the replacement text is still there
        const actualText = currentContent.substring(expectedReplacementPos, expectedEndPos)

        // Debug: Uncomment for undo restoration debugging
        // console.log('[UNDO] Restoration debug:', {
        //   currentContent: JSON.stringify(currentContent),
        //   startPos, expectedReplacementPos, expectedEndPos,
        //   replacementText: JSON.stringify(replacementText),
        //   actualText: JSON.stringify(actualText),
        //   originalText: JSON.stringify(originalText),
        //   matches: actualText === replacementText
        // })

        if (actualText === replacementText) {
          // Simple case: replacement is still in original position
          if ('value' in element) {
            const before = currentContent.substring(0, expectedReplacementPos)
            const after = currentContent.substring(expectedEndPos)
            const newValue = before + originalText + after

            element.value = newValue

            // Set cursor at end of restored text
            element.setSelectionRange(startPos + originalText.length, startPos + originalText.length)
            element.dispatchEvent(new Event('input', { bubbles: true }))
          } else if (element.isContentEditable || (element as any).contentEditable === 'true') {
            // Use Selection API to preserve formatting
            replaceInContentEditablePreservingFormat(element, expectedReplacementPos, expectedEndPos, originalText)
            element.dispatchEvent(new Event('input', { bubbles: true }))
          }
          history.splice(i, 1)
          return true
        } else {
          // Complex case: try to find the replacement text elsewhere
          const replacementIndex = currentContent.indexOf(replacementText, Math.max(0, startPos - 10))

          if (replacementIndex !== -1) {
            const endIndex = replacementIndex + replacementText.length

            if ('value' in element) {
              const newValue = currentContent.substring(0, replacementIndex) +
                              originalText +
                              currentContent.substring(endIndex)
              element.value = newValue
              element.setSelectionRange(replacementIndex + originalText.length, replacementIndex + originalText.length)
              element.dispatchEvent(new Event('input', { bubbles: true }))
            } else if (element.isContentEditable) {
              replaceInContentEditablePreservingFormat(element, replacementIndex, endIndex, originalText)
              element.dispatchEvent(new Event('input', { bubbles: true }))
            }
            history.splice(i, 1)
            return true
          }
        }

        // Can't find the replacement, remove stale entry
        history.splice(i, 1)
        return false
      }
    }

    return false
  }

  /**
   * Clear history for a specific element or all elements
   */
  function clear(element?: EditableEl): void {
    if (element) {
      const elementId = getElementId(element)
      // Remove entries for specific element
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].elementId === elementId) {
          history.splice(i, 1)
        }
      }
    } else {
      // Clear all history
      history.length = 0
    }
  }

  /**
   * Check if there is undo history for a specific element
   */
  function hasHistory(element: EditableEl): boolean {
    if (!element) return false
    const elementId = getElementId(element)
    return history.some(entry => entry.elementId === elementId)
  }

  /**
   * Get the total number of entries in history
   */
  function getHistoryLength(): number {
    return history.length
  }

  return {
    createEntry,
    undo,
    clear,
    hasHistory,
    getHistoryLength,
    getElementId
  }
}

export type ReplacementHistory = ReturnType<typeof createReplacementHistory>
