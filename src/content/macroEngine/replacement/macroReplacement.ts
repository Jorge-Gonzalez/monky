import { Macro, EditableEl } from "../../../types"
import { getTextContent, getSelection, replaceText } from "./editableUtils"
import { createReplacementHistory } from "./replacementHistory"

/**
 * Normalizes text for input elements by removing newlines and collapsing whitespace.
 * This duplicates the logic from inputTextReplacement.ts to determine what text
 * will actually be inserted into the input element.
 *
 * Note: We preserve leading/trailing spaces intentionally - they may be meaningful
 * in the replacement text.
 */
function normalizeForInputElement(text: string): string {
  return text.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ')
}

/**
 * Creates a macro replacement manager that handles text replacements and undo operations.
 * Uses a position-based undo system that captures text positions and snippets.
 */
export function createMacroReplacement() {
  // Create history manager
  const history = createReplacementHistory()

  /**
   * Perform text replacement and track in history for undo
   */
  function performReplacement(
    element: EditableEl,
    startPos: number,
    endPos: number,
    replacementText: string,
    macro: Macro,
    undoStartPos?: number,
    undoEndPos?: number,
    originalMacroCommand?: string
  ): void {
    if (!element) return

    const textContent = getTextContent(element)

    // For undo, use the original range (before space adjustment) if provided
    // In immediate mode, we may have a specific original command to restore
    const undoRange = {
      startPos: undoStartPos ?? startPos,
      endPos: undoEndPos ?? endPos,
      originalText: originalMacroCommand ||
                   (undoStartPos !== undefined && undoEndPos !== undefined
                     ? textContent.substring(undoStartPos, undoEndPos)
                     : textContent.substring(startPos, endPos))
    }

    // Determine the actual text that will be inserted into the element
    // For input elements, text is normalized (newlines removed, whitespace collapsed)
    // For textarea and contenteditable, text is used as-is
    const actualReplacementText = (element instanceof HTMLInputElement)
      ? normalizeForInputElement(replacementText)
      : replacementText

    // Debug: Uncomment for undo history debugging
    // console.log('[UNDO] Storing history entry:', {
    //   startPos: undoRange.startPos,
    //   endPos: undoRange.endPos,
    //   originalText: JSON.stringify(undoRange.originalText),
    //   replacementText: JSON.stringify(replacementText),
    //   actualReplacementText: JSON.stringify(actualReplacementText),
    //   actualReplacementRange: { startPos, endPos }
    // })

    // Store in undo history using the actual text that will be inserted
    history.createEntry(
      element,
      undoRange.startPos,
      undoRange.endPos,
      undoRange.originalText,
      actualReplacementText
    )

    // Perform the actual replacement using tested editableUtils
    const macroForReplacement: Macro = {
      ...macro,
      text: replacementText
    }
    replaceText(element, macroForReplacement, startPos, endPos)
  }

  /**
   * Undo the last macro replacement for a specific element
   */
  function undoLastReplacement(activeEl: EditableEl): boolean {
    return history.undo(activeEl)
  }

  /**
   * Clear undo history for a specific element or all
   */
  function clearUndoHistory(element?: EditableEl): void {
    history.clear(element)
  }

  /**
   * Check if there is undo history for a specific element
   */
  function hasUndoHistory(element: EditableEl): boolean {
    return history.hasHistory(element)
  }

  /**
   * Get the number of undo history entries
   */
  function getUndoHistoryLength(): number {
    return history.getHistoryLength()
  }

  /**
   * Get element ID (for debugging/testing)
   */
  function getElementId(element: EditableEl): string {
    return history.getElementId(element)
  }

  /**
   * Get current cursor position (for backward compatibility)
   */
  function getCursorPosition(element: EditableEl): number | null {
    return getSelection(element)?.start ?? null
  }

  /**
   * Set cursor position (for backward compatibility)
   * This is a simplified version - full implementation is in editableUtils
   */
  function setCursorPosition(element: EditableEl, position: number): void {
    if ('setSelectionRange' in element) {
      element.focus()
      element.setSelectionRange(position, position)
    }
    // For contentEditable, this would need more complex logic from editableUtils
  }

  // Re-export utilities for backward compatibility
  return {
    performReplacement,
    undoLastReplacement,
    clearUndoHistory,
    hasUndoHistory,
    getUndoHistoryLength,
    getElementId,
    getTextContent,
    getCursorPosition,
    setCursorPosition
  }
}

export type MacroReplacement = ReturnType<typeof createMacroReplacement>
