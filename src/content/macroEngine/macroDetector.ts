import { useMacroStore } from "../../store/useMacroStore"
import { updateStateOnKey, isExact, getExact } from "./detector-core"
import { getActiveEditable, getSelection, getCursorCoordinates } from "./replacement/editableUtils"
import { replaceText } from './replacement/macroReplacement'
import { Macro, CoreState, EditableEl } from "../../types"
import { isPrintableKey, UNSUPPORTED_KEYS } from "./keyUtils"
import { defaultMacroConfig } from "../../config/defaults"
import { SYSTEM_MACROS, isSystemMacro, handleSystemMacro } from "../systemMacros/systemMacros"
import { DetectorActions } from "../actions/detectorActions"
import { createMacroReplacement } from "./replacement/macroReplacement"

const COMMIT_KEYS = new Set([" ", "Enter"])
const CONFIRM_DELAY_MS = 1850

/**
 * Creates the core macro system that coordinates detection and replacement
 * This is the main entry point for the macro functionality
 */
export function createMacroDetector(actions: DetectorActions) {
  // Create replacement manager
  const replacement = createMacroReplacement()
  let macros: Macro[] = []
  let activeEl: EditableEl = null
  let state: CoreState = { active: false, buffer: "" }
  let timer: number = 0
  let selectionOnSchedule: { start: number; end: number } | null = null
  let listenersAttached = false
  let config = {
    useCommitKeys: false,
    prefixes: defaultMacroConfig.prefixes,
    disabledSites: [] as string[],
  }

  function clearTimer() {
    if (timer > 0) {
      clearTimeout(timer)
      timer = 0
      selectionOnSchedule = null
    }
  }

  function cancelDetection() {
    clearTimer()
    clearBlurTimer()
    const wasActive = state.active
    state = { active: false, buffer: "" }
    
    if (wasActive) {
      actions.onDetectionCancelled()
    }
  }

  function commitReplace(macro: Macro, sel: { start: number; end: number } | null, isImmediate: boolean) {
    if (!activeEl) {
      return
    }

    // Calculate positions
    let commandStart: number
    let endPos: number

    if (selectionOnSchedule && !isImmediate) {
      endPos = selectionOnSchedule.end + 1
      commandStart = Math.max(0, endPos - state.buffer.length)
    } else if (sel) {
      endPos = sel.end
      commandStart = Math.max(0, endPos - state.buffer.length)
    }

    // Store original range for undo tracking (before space adjustment)
    const originalCommandStart = commandStart
    const originalEndPos = endPos

    // Find the actual start of the macro (the prefix character) to avoid including preceding spaces
    const text = replacement.getTextContent(activeEl)
    const macroText = text.substring(commandStart, endPos)

    // Find the last occurrence of any configured prefix
    let prefixIndex = -1
    for (const prefix of config.prefixes) {
      const idx = macroText.lastIndexOf(prefix)
      if (idx > prefixIndex) {
        prefixIndex = idx
      }
    }

    if (prefixIndex !== -1) {
      // Adjust commandStart to point to the prefix character, not any preceding space
      commandStart = commandStart + prefixIndex
    }

    // Debug: Uncomment for range calculation debugging
    // console.log('[COMMIT-REPLACE] Final range:', {
    //   mode: isImmediate ? 'immediate' : 'scheduled',
    //   buffer: state.buffer,
    //   bufferLength: state.buffer.length,
    //   originalCommandStart: Math.max(0, endPos - state.buffer.length),
    //   adjustedCommandStart: commandStart,
    //   endPos,
    //   textContent: text,
    //   textToReplace: text.substring(commandStart, endPos),
    //   macroText: macro.text
    // })

    if (!sel && !selectionOnSchedule) {
      cancelDetection()
      return
    }

    if (commandStart < 0) {
      cancelDetection()
      return
    }

    // Handle system macros (without undo tracking)
    if (isSystemMacro(macro)) {
      const deleteMacro: Macro = {
        id: 'temp-delete',
        command: '',
        text: '',
        contentType: 'text/plain'
      }
      replaceText(activeEl, deleteMacro, commandStart, endPos)
      handleSystemMacro(macro)
      actions.onMacroCommitted(String(macro.id))
      cancelDetection()
      return
    }

    // Regular macro replacement with undo tracking
    // Use adjusted range for replacement, but original range for undo tracking
    // In immediate mode, also pass the original macro command for correct undo
    const originalCommandForUndo = isImmediate ? state.buffer : undefined;
    replacement.performReplacement(activeEl, commandStart, endPos, macro.text, macro, originalCommandStart, originalEndPos, originalCommandForUndo)
    actions.onMacroCommitted(String(macro.id))
    cancelDetection()
  }

  function scheduleConfirmIfExact(sel: { start: number; end: number } | null): boolean {
    clearTimer()

    if (config.prefixes.includes(state.buffer)) return false
    if (!isExact(state.buffer, macros)) return false

    const isPrefix = macros.some(m => m.command.startsWith(state.buffer) && m.command !== state.buffer)

    if (!isPrefix) {
      commitReplace(getExact(state.buffer, macros)!, sel, true)
      return true
    } else {
      if (!sel) return false
      selectionOnSchedule = sel

      timer = window.setTimeout(() => {
        if (isExact(state.buffer, macros) && activeEl) {
          commitReplace(getExact(state.buffer, macros)!, null, false)
        } else {
          cancelDetection()
        }
      }, CONFIRM_DELAY_MS)
      return false
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    // Handle Ctrl+Z / Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      const editable = getActiveEditable(e.target)
      activeEl = editable // Set active element for undo context

      // Only handle undo if we have history for this element
      if (editable && replacement.hasUndoHistory(editable)) {
        const undone = replacement.undoLastReplacement(editable)

        if (undone) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
      }
    }

    if (config.disabledSites.includes(window.location.hostname)) {
      return
    }

    const editable = getActiveEditable(e.target)
    if (!editable) {
      if (state.active) {
        cancelDetection()
      }
      return
    }
    activeEl = editable

    const sel = getSelection(editable)
    if (!sel || sel.start !== sel.end) {
      if (state.active) {
        cancelDetection()
      }
      return
    }

    const prevStateActive = state.active

    // Handle navigation keys
    if (state.active && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      let direction: 'up' | 'down' | 'left' | 'right';
      if (e.key === 'ArrowUp') direction = 'up';
      else if (e.key === 'ArrowDown') direction = 'down';
      else if (e.key === 'ArrowLeft') direction = 'left';
      else direction = 'right';
      
      const handled = actions.onNavigationRequested(direction as any)
      if (handled) {
        e.preventDefault()
      }
      return
    }

    // Handle Tab key
    if (state.active && e.key === 'Tab') {
      if (actions.onNavigationRequested && actions.onNavigationRequested('right' as any)) {
        e.preventDefault();
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      clearBlurTimer()
      
      if (actions.onShowAllRequested) {
        const coords = getCursorCoordinates();
        actions.onShowAllRequested(state.buffer, coords || undefined);
      } else {
        const coords = getCursorCoordinates();
        actions.onDetectionUpdated(state.buffer, coords || undefined);
      }
      return;
    }

    // Handle Escape
    if (state.active && e.key === 'Escape') {
      const handled = actions.onCancelRequested()
      if (handled) {
        e.preventDefault()
      }
      cancelDetection()
      return
    }

    // Handle commit keys in manual mode
    if (config.useCommitKeys && state.buffer && COMMIT_KEYS.has(e.key)) {
      const handled = actions.onCommitRequested(state.buffer)

      if (handled) {
        // Only prevent event and commit if we have an exact match
        // If handled=true but no exact match, it means the overlay is visible
        // and will handle the selection, so don't prevent the event
        const macroToCommit = getExact(state.buffer, macros);
        if (macroToCommit) {
          e.preventDefault()
          commitReplace(macroToCommit, sel, false)
        }
        // If no exact match, let the event bubble to the overlay
      } else {
        if (isExact(state.buffer, macros)) {
          e.preventDefault()
          commitReplace(getExact(state.buffer, macros)!, sel, false)
        } else {
          cancelDetection()
        }
      }
      return
    }

    // Handle Backspace
    if (e.key === "Backspace") {
      clearTimer()
      const prevState = { ...state }
      
      let currentState = state
      if (!state.active && !state.buffer) {
        const textContent = activeEl && 'value' in activeEl 
          ? activeEl.value 
          : activeEl?.textContent || ''
        const cursorPos = sel.start
        
        let reconstructedBuffer = ''
        for (let i = cursorPos - 1; i >= 0; i--) {
          const char = textContent[i]
          if (char === ' ' || char === '\n' || char === '\t') break
          reconstructedBuffer = char + reconstructedBuffer
          
          if (config.prefixes.some(prefix => reconstructedBuffer.startsWith(prefix))) {
            currentState = { active: true, buffer: reconstructedBuffer }
            break
          }
        }
      }
      
      state = updateStateOnKey(currentState, e.key, macros, config.prefixes)
      
      if (state.active) {
        actions.onDetectionUpdated(state.buffer)
      } else {
        cancelDetection()
      }
      return
    }

    // Handle printable characters
    if (isPrintableKey(e)) {
      const prevBuffer = state.buffer
      state = updateStateOnKey(state, e.key, macros, config.prefixes)

      if (!config.useCommitKeys) {
        if (state.active) {
          const committedImmediately = scheduleConfirmIfExact(sel)
          if (committedImmediately) {
            // In immediate mode, prevent the character from being added to avoid duplication
            // The macro replacement will handle the full command that includes the triggering character
            e.preventDefault()
          }
          
          const coords = getCursorCoordinates()
          
          if (!committedImmediately) {
            if (prevStateActive) {
              actions.onDetectionUpdated(state.buffer, coords || undefined)
            } else {
              actions.onDetectionStarted(state.buffer, coords || undefined)
            }
          }
        } else {
          if (prevStateActive) {
            clearTimer()
            cancelDetection()
          }
        }
      } else {
        if (state.active) {
          if (prevStateActive) {
            const coords = getCursorCoordinates()
            actions.onDetectionUpdated(state.buffer, coords ?? undefined)
          } else {
            const coords = getCursorCoordinates()
            actions.onDetectionStarted(state.buffer, coords ?? undefined)
          }
        } else if (prevStateActive) {
          cancelDetection()
        }
      }
      return
    }

    // Other keys cancel detection
    if (UNSUPPORTED_KEYS.includes(e.key)) {
      cancelDetection()
    }
  }

  let blurTimer: number = 0

  function clearBlurTimer() {
    if (blurTimer > 0) {
      clearTimeout(blurTimer)
      blurTimer = 0
    }
  }

  function onBlur() {
    clearBlurTimer()
    blurTimer = window.setTimeout(() => {
      cancelDetection()
    }, 100)
  }

  function updateConfig() {
    const storeConfig = useMacroStore.getState().config
    config = {
      useCommitKeys: storeConfig.useCommitKeys ?? false,
      prefixes: storeConfig.prefixes || defaultMacroConfig.prefixes,
      disabledSites: storeConfig.disabledSites || [],
    }
  }

  function attachListeners(): void {
    if (listenersAttached) return
    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("blur", onBlur, true)
    listenersAttached = true
  }

  function detachListeners(): void {
    if (!listenersAttached) return
    window.removeEventListener("keydown", onKeyDown, true)
    window.removeEventListener("blur", onBlur, true)
    listenersAttached = false
    clearBlurTimer()
    cancelDetection()
    replacement.clearUndoHistory()
  }

  function initialize(): void {
    attachListeners()
    updateConfig()
    useMacroStore.subscribe(updateConfig)
  }

  function setMacros(newMacros: Macro[]): void {
    macros = [...SYSTEM_MACROS, ...newMacros]
    
    if ('setMacros' in actions && typeof actions.setMacros === 'function') {
      (actions as any).setMacros([...SYSTEM_MACROS, ...newMacros]);
    }
  }

  function getState(): CoreState {
    return { ...state }
  }

  /**
   * Handle macro selection from overlay (e.g., manual commit mode)
   */
  function handleMacroSelectedFromOverlay(macro: Macro, buffer: string, element?: EditableEl): void {
    // Use provided element or try to get the current active element
    const targetEl = element || activeEl || getActiveEditable(document.activeElement)

    if (!targetEl) {
      return
    }

    const textContent = replacement.getTextContent(targetEl)
    const cursorPos = replacement.getCursorPosition(targetEl)

    if (cursorPos === null) {
      return
    }

    // Find the buffer text before the cursor
    const triggerIndex = textContent.lastIndexOf(buffer, cursorPos)

    if (triggerIndex === -1) {
      return
    }

    const endPos = triggerIndex + buffer.length

    // Use performReplacement to ensure proper undo tracking
    replacement.performReplacement(targetEl, triggerIndex, endPos, macro.text, macro)

    // Notify that macro was committed
    actions.onMacroCommitted(String(macro.id))

    // Clean up detection state
    cancelDetection()
  }

  /**
   * Handle macro selection from search overlay (inserts at cursor position)
   */
  function handleMacroSelectedFromSearchOverlay(macro: Macro, element: EditableEl): void {
    if (!element) {
      return
    }

    // Restore focus to the element first
    element.focus()

    const cursorPos = replacement.getCursorPosition(element)

    if (cursorPos === null) {
      return
    }

    // Insert at current cursor position (no text to replace)
    // Use performReplacement to ensure proper undo tracking
    replacement.performReplacement(element, cursorPos, cursorPos, macro.text, macro)

    actions.onMacroCommitted(String(macro.id))
  }

  return {
    initialize,
    setMacros,
    getState,
    destroy: detachListeners,
    // Expose undo utilities for external use (delegate to replacement)
    undoLastReplacement: (element: EditableEl) => replacement.undoLastReplacement(element),
    clearUndoHistory: (element?: EditableEl) => replacement.clearUndoHistory(element),
    getUndoHistoryLength: () => replacement.getUndoHistoryLength(),
    // Expose for overlay integration
    handleMacroSelectedFromOverlay,
    handleMacroSelectedFromSearchOverlay,
  }
}

export type MacroDetector = ReturnType<typeof createMacroDetector>