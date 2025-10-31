import { Macro, EditableEl } from "../../../types"
import { getTextContent, getSelection, normalizeForInputElement } from "./editableUtils"
import { replaceInInput } from "./inputTextReplacement"
import { replacePlainText } from "./plainTextReplacement"
import { createReplacementHistory } from "./replacementHistory"
import { replaceWithMarker } from "./richTextReplacement"

/**
 * Replaces a range of text in an editable element with the text from a macro.
 * It handles <input>, <textarea>, and contenteditable elements.
 */
export function replaceText(el: EditableEl, macro: Macro, startPos: number, endPos: number) {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return replaceInInput(el, startPos, endPos, macro.text)
  }

  if (macro.contentType === 'text/html' && macro.html) {
    return replaceWithMarker(el, startPos, endPos, macro.html, {
      macroId: String(macro.id),
      originalCommand: macro.command,
      insertedAt: Date.now(),
      isHtml: true
    })
  }

  return replacePlainText(el, startPos, endPos, macro.text)
}

/**
 * Creates a macro replacement manager that handles text replacements and undo operations.
 * Uses a marker based undo approach for rich text elements by wrapping inserted content with a marker element.
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
    undoEndPos?: number
  ): void {
    if (!element) return

    // For undo, we store empty string so that undo simply deletes the replacement
    // without restoring the typed command, allowing users to immediately type again
    const undoRange = {
      startPos: undoStartPos ?? startPos,
      endPos: undoEndPos ?? endPos,
      originalText: '' // Undo should just clear the replacement, not restore the command
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
