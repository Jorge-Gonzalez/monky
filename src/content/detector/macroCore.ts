import { createMacroDetector } from "./macroDetector"
import { DetectorActions } from "../actions/detectorActions"
import { Macro, CoreState, EditableEl } from "../../types"

/**
 * Creates the core macro system that coordinates detection and replacement
 * This is the main entry point for the macro functionality
 */
export function createMacroCore(actions: DetectorActions) {
  // Create the detector which internally manages replacement
  const detector = createMacroDetector(actions)

  /**
   * Initialize the macro system
   */
  function initialize(): void {
    detector.initialize()
  }

  /**
   * Set the macros to be detected
   */
  function setMacros(macros: Macro[]): void {
    detector.setMacros(macros)
  }

  /**
   * Get the current detection state
   */
  function getState(): CoreState {
    return detector.getState()
  }

  /**
   * Undo the last macro replacement for a specific element
   */
  function undoLastReplacement(element: EditableEl): boolean {
    return detector.undoLastReplacement(element)
  }

  /**
   * Clear undo history for a specific element or all elements
   */
  function clearUndoHistory(element?: EditableEl): void {
    detector.clearUndoHistory(element)
  }

  /**
   * Get the number of entries in the undo history
   */
  function getUndoHistoryLength(): number {
    return detector.getUndoHistoryLength()
  }

  /**
   * Handle macro selection from overlay
   */
  function handleMacroSelectedFromOverlay(macro: Macro, buffer: string, element?: EditableEl): void {
    detector.handleMacroSelectedFromOverlay(macro, buffer, element)
  }

  /**
   * Handle macro selection from search overlay
   */
  function handleMacroSelectedFromSearchOverlay(macro: Macro, element: EditableEl): void {
    detector.handleMacroSelectedFromSearchOverlay(macro, element)
  }

  /**
   * Destroy the macro system and clean up
   */
  function destroy(): void {
    detector.destroy()
  }

  return {
    initialize,
    setMacros,
    getState,
    undoLastReplacement,
    clearUndoHistory,
    getUndoHistoryLength,
    handleMacroSelectedFromOverlay,
    handleMacroSelectedFromSearchOverlay,
    destroy,
  }
}

export type MacroCore = ReturnType<typeof createMacroCore>
