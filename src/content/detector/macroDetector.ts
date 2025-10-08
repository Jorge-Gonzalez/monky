import { useMacroStore } from "../../store/useMacroStore"
import { updateStateOnKey, isExact } from "../detector-core"
import { getActiveEditable, getSelection, replaceText, getCursorCoordinates } from "../editableUtils"
import { Macro, CoreState, EditableEl } from "../../types"
import { isPrintableKey, UNSUPPORTED_KEYS } from "../keyUtils"
import { defaultMacroConfig } from "../../config/defaults"
import { SYSTEM_MACROS, isSystemMacro, handleSystemMacro } from "../systemMacros"
import { DetectorActions } from "../actions/detectorActions"

const COMMIT_KEYS = new Set([" ", "Enter", "Tab"])
const CONFIRM_DELAY_MS = 1850

export function createMacroDetector(actions: DetectorActions) {
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
    const wasActive = state.active
    state = { active: false, buffer: "" }
    
    if (wasActive) {
      actions.onDetectionCancelled()
    }
  }

  function getExact(buffer: string): Macro | null {
    return macros.find(m => m.command === buffer) || null
  }

  function commitReplace(macro: Macro, sel: { start: number; end: number } | null, isImmediate: boolean) {
    if (!activeEl) {
      return
    }

    // Handle system macros
    if (isSystemMacro(macro)) {
      let commandStart: number
      let endPos: number

      if (selectionOnSchedule && !isImmediate) {
        endPos = selectionOnSchedule.end + 1
        commandStart = endPos - state.buffer.length
      } else if (sel) {
        endPos = sel.end
        const commandLengthInDom = isImmediate ? state.buffer.length - 1 : state.buffer.length
        commandStart = endPos - commandLengthInDom
      } else {
        cancelDetection()
        return
      }

      if (commandStart >= 0) {
        const deleteMacro: Macro = {
          id: 'temp-delete',
          command: '',
          text: '',
          contentType: 'text/plain'
        }
        replaceText(activeEl, deleteMacro, commandStart, endPos)
      }

      handleSystemMacro(macro)
      actions.onMacroCommitted(macro.id)
      cancelDetection()
      return
    }

    // Regular macro replacement
    let commandStart: number
    let endPos: number

    if (selectionOnSchedule && !isImmediate) {
      endPos = selectionOnSchedule.end + 1
      commandStart = endPos - state.buffer.length
    } else if (sel) {
      endPos = sel.end
      const commandLengthInDom = isImmediate ? state.buffer.length - 1 : state.buffer.length
      commandStart = endPos - commandLengthInDom
    } else {
      cancelDetection()
      return
    }

    if (commandStart < 0) {
      cancelDetection()
      return
    }
    
    replaceText(activeEl, macro, commandStart, endPos)
    actions.onMacroCommitted(macro.id)
    cancelDetection()
  }

  function scheduleConfirmIfExact(sel: { start: number; end: number } | null): boolean {
    clearTimer()
    if (!isExact(state, macros)) return false

    const isPrefix = macros.some(m => m.command.startsWith(state.buffer) && m.command !== state.buffer)

    if (!isPrefix) {
      commitReplace(getExact(state.buffer)!, sel, true)
      return true
    } else {
      if (!sel) return false
      selectionOnSchedule = sel

      timer = window.setTimeout(() => {
        if (isExact(state, macros) && activeEl) {
          commitReplace(getExact(state.buffer)!, null, false)
        } else {
          cancelDetection()
        }
      }, CONFIRM_DELAY_MS)
      return false
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (config.disabledSites.includes(window.location.hostname)) {
      return
    }

    const editable = getActiveEditable(e.target)
    if (!editable) {
      if (state.active) cancelDetection()
      return
    }
    activeEl = editable

    const sel = getSelection(editable)
    if (!sel || sel.start !== sel.end) {
      if (state.active) cancelDetection()
      return
    }

    const prevStateActive = state.active

    // Handle navigation keys
    if (state.active && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      const handled = actions.onNavigationRequested(e.key === 'ArrowUp' ? 'up' : 'down')
      if (handled) {
        e.preventDefault()
      }
      return
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
      // Ask action handler if they want to handle this
      const handled = actions.onCommitRequested(state.buffer)
      
      if (handled) {
        e.preventDefault()
        // If the coordinator handled it, it means a selection was made from the overlay.
        // We need to commit the replacement here. The coordinator's job is just to
        // confirm the selection, not to trigger the replacement logic itself.
        const macroToCommit = getExact(state.buffer);
        if (macroToCommit) {
          commitReplace(macroToCommit, sel, false)
        }
        // If no exact macro, do nothing (the coordinator might have done something else)
      } else {
        // If not handled by the overlay (e.g., it's not visible),
        // proceed with the default commit logic.
        if (isExact(state, macros)) {
          // If it's an exact match, we always handle it and prevent default.
          e.preventDefault()
          commitReplace(getExact(state.buffer)!, sel, false)
        }
        // If not handled and not an exact match, we do nothing and let the
        // key (e.g., a space) be typed normally. The detector will cancel
        // itself on the next non-matching key.
      }
      return
    }

    // Handle Backspace
    if (e.key === "Backspace") {
      clearTimer()
      state = updateStateOnKey(state, e.key, macros, config.prefixes)
      
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
        // Automatic mode
        if (state.active) {
          const committedImmediately = scheduleConfirmIfExact(sel)
          if (committedImmediately) {
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
        // Manual mode
        if (state.active) {
          const coords = getCursorCoordinates()
          
          if (prevStateActive) {
            actions.onDetectionUpdated(state.buffer, coords || undefined)
          } else {
            actions.onDetectionStarted(state.buffer, coords || undefined)
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

  function onBlur() {
    cancelDetection()
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
    cancelDetection()
  }

  function initialize(): void {
    attachListeners()
    updateConfig()
    useMacroStore.subscribe(updateConfig)
  }

  function setMacros(newMacros: Macro[]): void {
    macros = [...SYSTEM_MACROS, ...newMacros]
  }

  function getState(): CoreState {
    return { ...state }
  }

  return {
    initialize,
    setMacros,
    getState,
    destroy: detachListeners,
  }
}

export type MacroDetector = ReturnType<typeof createMacroDetector>
