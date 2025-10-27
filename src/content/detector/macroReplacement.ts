import { Macro, EditableEl } from "../../types"

// Types for element references and history
export interface ElementRef {
  id?: string;
  selector?: string;
  element: EditableEl;
}

export interface ReplacementHistoryEntry {
  elementRef: ElementRef;
  startPos: number
  endPos: number
  originalText: string
  replacementText: string
  macro: Macro
  timestamp: number
  elementId: string
}

const MAX_UNDO_HISTORY = 50 // Keep last 50 replacements

/**
 * Creates a macro replacement manager that handles text replacements and undo operations
 */
export function createMacroReplacement() {
  // Undo history stack
  const undoHistory: ReplacementHistoryEntry[] = []

  // Map to track element IDs for efficient lookup
  const elementIdMap = new WeakMap<EditableEl, string>()
  let elementCounter = 0

  /**
   * Generate or get unique ID for element
   */
  function getElementId(element: EditableEl): string {
    if (!elementIdMap.has(element)) {
      const id = `element_${elementCounter++}`
      elementIdMap.set(element, id)
    }
    return elementIdMap.get(element)!
  }

  /**
   * Extract text content from an editable element
   */
  function getTextContent(element: EditableEl): string {
    if (!element) return ''

    if ('value' in element) {
      return element.value
    } else if ('textContent' in element) {
      return element.textContent || ''
    }
    return ''
  }

  /**
   * Get current cursor position in the element
   */
  function getCursorPosition(element: EditableEl): number | null {
    if (!element) return null

    if ('selectionStart' in element) {
      return element.selectionStart
    } else if (element.isContentEditable) {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return null

      const range = selection.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(element as Node)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      return preCaretRange.toString().length
    }

    return null
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
      const selection = window.getSelection()
      if (!selection) return

      let currentPos = 0
      const walker = document.createTreeWalker(
        element as Node,
        NodeFilter.SHOW_TEXT,
        null
      )

      let node: Text | null = null
      while ((node = walker.nextNode() as Text)) {
        const nodeLength = node.textContent?.length || 0

        if (currentPos + nodeLength >= position) {
          const range = document.createRange()
          range.setStart(node, position - currentPos)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
          return
        }

        currentPos += nodeLength
      }
    }
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

    const range = document.createRange()
    let currentPos = 0
    let startNode: Node | null = null
    let startOffset = 0
    let endNode: Node | null = null
    let endOffset = 0

    const walker = document.createTreeWalker(
      element as Node,
      NodeFilter.SHOW_TEXT,
      null
    )

    let node: Text | null = null
    while ((node = walker.nextNode() as Text)) {
      const nodeLength = node.textContent?.length || 0

      // Find start position
      if (!startNode && currentPos + nodeLength >= startPos) {
        startNode = node
        startOffset = startPos - currentPos
      }

      // Find end position
      if (!endNode && currentPos + nodeLength >= endPos) {
        endNode = node
        endOffset = endPos - currentPos
        break
      }

      currentPos += nodeLength
    }

    if (!startNode || !endNode) return null

    try {
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
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
   * Perform text replacement and track in history
   */
  function performReplacement(
    element: EditableEl,
    startPos: number,
    endPos: number,
    replacementText: string,
    macro: Macro,
    undoStartPos?: number,
    undoEndPos?: number,
    originalMacroCommand?: string  // The original macro command for immediate mode
  ): void {
    if (!element) return

    const textContent = getTextContent(element)
    const originalText = textContent.substring(startPos, endPos)

    // For undo, use the original range (before space adjustment) if provided
    // In immediate mode, we may have a specific original command to restore
    const undoRange = {
      startPos: undoStartPos ?? startPos,
      endPos: undoEndPos ?? endPos,
      originalText: originalMacroCommand ||
                   (undoStartPos !== undefined && undoEndPos !== undefined
                     ? textContent.substring(undoStartPos, undoEndPos)
                     : originalText)
    }

    // Debug: Uncomment for undo history debugging
    // console.log('[UNDO] Storing history entry:', {
    //   startPos: undoRange.startPos,
    //   endPos: undoRange.endPos,
    //   originalText: JSON.stringify(undoRange.originalText),
    //   replacementText: JSON.stringify(replacementText),
    //   actualReplacementRange: { startPos, endPos },
    //   actualReplacementText: JSON.stringify(originalText)
    // })

    // Store in undo history using the original range
    const elementId = getElementId(element);
    const historyEntry: ReplacementHistoryEntry = {
      elementRef: { element, id: elementId },
      startPos: undoRange.startPos,
      endPos: undoRange.endPos,
      originalText: undoRange.originalText,
      replacementText,
      macro,
      timestamp: Date.now(),
      elementId
    }

    undoHistory.push(historyEntry)

    // Keep history size manageable
    if (undoHistory.length > MAX_UNDO_HISTORY) {
      undoHistory.shift()
    }

    // Perform the actual replacement
    if ('value' in element) {
      // Input/textarea
      const newValue = textContent.substring(0, startPos) + replacementText + textContent.substring(endPos)
      element.value = newValue

      // Set cursor after replacement
      const newCursorPos = startPos + replacementText.length
      element.setSelectionRange(newCursorPos, newCursorPos)

      // Dispatch input event for framework reactivity
      element.dispatchEvent(new Event('input', { bubbles: true }))
    } else if (element.isContentEditable || element.contentEditable === 'true') {
      // ContentEditable - use Selection API to preserve formatting
      replaceInContentEditablePreservingFormat(element, startPos, endPos, replacementText)

      // Dispatch input event
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  /**
   * Undo replacement in contentEditable while preserving HTML formatting
   */
  function undoInContentEditablePreservingFormat(
    element: EditableEl,
    startPos: number,
    endPos: number,
    originalText: string
  ): void {
    const selection = window.getSelection()
    if (!selection) return

    // Find and select the replacement text
    const range = createRangeFromTextPositions(element, startPos, endPos)
    if (!range) return

    selection.removeAllRanges()
    selection.addRange(range)

    // Delete the replacement
    range.deleteContents()

    // Insert the original text
    const textNode = document.createTextNode(originalText)
    range.insertNode(textNode)

    // Move cursor after the restored text
    range.setStartAfter(textNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  /**
   * Undo the last macro replacement for a specific element
   */
  function undoLastReplacement(activeEl: EditableEl): boolean {
    if (undoHistory.length === 0 || !activeEl) return false

    const activeElementId = getElementId(activeEl);

    // Find the index of the last entry for the active element
    let lastEntryIndex = -1
    for (let i = undoHistory.length - 1; i >= 0; i--) {
      if (undoHistory[i].elementId === activeElementId) {
        lastEntryIndex = i
        break
      }
    }

    if (lastEntryIndex === -1) return false

    const lastEntry = undoHistory.splice(lastEntryIndex, 1)[0]
    if (!lastEntry) return false

    const { elementRef, startPos, originalText, replacementText } = lastEntry;
    const element = elementRef.element;

    // Check if element still exists and is valid
    if (!element || !document.contains(element as Node)) {
      return false
    }

    const currentContent = getTextContent(element)
    const currentCursorPos = getCursorPosition(element)

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
        undoInContentEditablePreservingFormat(element, expectedReplacementPos, expectedEndPos, originalText)
        element.dispatchEvent(new Event('input', { bubbles: true }))
      }
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
          undoInContentEditablePreservingFormat(element, replacementIndex, endIndex, originalText)
          element.dispatchEvent(new Event('input', { bubbles: true }))
        }
        return true
      }
    }

    return false
  }

  /**
   * Clear undo history for a specific element or all
   */
  function clearUndoHistory(element?: EditableEl): void {
    if (element) {
      const elementId = getElementId(element);
      // Remove entries for specific element
      for (let i = undoHistory.length - 1; i >= 0; i--) {
        if (undoHistory[i].elementId === elementId) {
          undoHistory.splice(i, 1)
        }
      }
    } else {
      // Clear all history
      undoHistory.length = 0
    }
  }

  /**
   * Check if there is undo history for a specific element
   */
  function hasUndoHistory(element: EditableEl): boolean {
    if (!element) return false
    const elementId = getElementId(element)
    return undoHistory.some(entry => entry.elementId === elementId)
  }

  /**
   * Get the number of undo history entries
   */
  function getUndoHistoryLength(): number {
    return undoHistory.length
  }

  return {
    performReplacement,
    undoLastReplacement,
    clearUndoHistory,
    hasUndoHistory,
    getUndoHistoryLength,
    getElementId,
    getTextContent,
    getCursorPosition,
    setCursorPosition,
  }
}

export type MacroReplacement = ReturnType<typeof createMacroReplacement>
