import { useMacroStore } from "../../store/useMacroStore"
import { updateStateOnKey, isExact } from "./detector-core"
import { getActiveEditable, getSelection, replaceText, getCursorCoordinates } from "./editableUtils"
import { Macro, CoreState, EditableEl } from "../../types"
import { isPrintableKey, UNSUPPORTED_KEYS } from "./keyUtils"
import { defaultMacroConfig } from "../../config/defaults"
import { SYSTEM_MACROS, isSystemMacro, handleSystemMacro } from "../systemMacros/systemMacros"
import { DetectorActions } from "../actions/detectorActions"

const COMMIT_KEYS = new Set([" ", "Enter"])
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
    // console.log(`[MACRO-DETECTOR] 🚫 cancelDetection called | Was active: ${state.active}, buffer: "${state.buffer}"`)
    clearTimer()
    clearBlurTimer()
    const wasActive = state.active
    const wasBuffer = state.buffer
    state = { active: false, buffer: "" }
    
    if (wasActive) {
      // console.log(`[MACRO-DETECTOR] 🚫 Calling onDetectionCancelled (was buffer: "${wasBuffer}")`)
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
      actions.onMacroCommitted(String(macro.id))
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
    actions.onMacroCommitted(String(macro.id))
    cancelDetection()
  }

  function scheduleConfirmIfExact(sel: { start: number; end: number } | null): boolean {
    clearTimer()

    // Do not attempt commit logic when the buffer is exactly a configured prefix (e.g., "/")
    if (config.prefixes.includes(state.buffer)) return false

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
    // console.log(`[MACRO-DETECTOR] 🔧 KeyDown: "${e.key}" | Active: ${state.active} | Buffer: "${state.buffer}" | UseCommitKeys: ${config.useCommitKeys}`)
    
    if (config.disabledSites.includes(window.location.hostname)) {
      // console.log(`[MACRO-DETECTOR] 🚫 Site disabled: ${window.location.hostname}`)
      return
    }

    const editable = getActiveEditable(e.target)
    if (!editable) {
      if (state.active) {
        // console.log(`[MACRO-DETECTOR] 🔍 No editable element, cancelling detection`)
        cancelDetection()
      }
      return
    }
    activeEl = editable

    const sel = getSelection(editable)
    if (!sel || sel.start !== sel.end) {
      if (state.active) {
        // console.log(`[MACRO-DETECTOR] 🔍 Selection invalid (start: ${sel?.start}, end: ${sel?.end}), cancelling detection`)
        cancelDetection()
      }
      return
    }

    const prevStateActive = state.active

    // Handle navigation keys
    if (state.active && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      // console.log(`[MACRO-DETECTOR] 🔼🔽 Navigation key: ${e.key}`)
      let direction: 'up' | 'down' | 'left' | 'right';
      if (e.key === 'ArrowUp') direction = 'up';
      else if (e.key === 'ArrowDown') direction = 'down';
      else if (e.key === 'ArrowLeft') direction = 'left';
      else direction = 'right';
      
      const handled = actions.onNavigationRequested(direction as any)
      if (handled) {
        // console.log(`[MACRO-DETECTOR] ✅ Navigation handled, preventing default`)
        e.preventDefault()
      }
      return
    }

    // Handle Tab key - show all suggestions for fuzzy search
    if (state.active && e.key === 'Tab') {
      // console.log(`[MACRO-DETECTOR] 📋 Tab pressed, showing all suggestions for fuzzy search`)
      
      // Check if navigation is currently being handled by overlay
      if (actions.onNavigationRequested && actions.onNavigationRequested('right' as any)) {
        // If the overlay is handling navigation, let it handle Tab as well
        e.preventDefault();
        return;
      }
      
      e.preventDefault(); // Prevent default tab behavior (losing focus)
      e.stopPropagation(); // Stop the event from propagating to other listeners
      
      // Clear any pending blur timer since we're intentionally triggering an overlay
      clearBlurTimer()
      
      // For Tab key during detection, we want to trigger showAll mode in the suggestions
      // We'll implement a new interface method for this purpose
      if (actions.onShowAllRequested) {
        const coords = getCursorCoordinates();
        actions.onShowAllRequested(state.buffer, coords || undefined);
      } else {
        // Fallback for coordinators that don't support onShowAllRequested
        // Just continue with normal detection update
        const coords = getCursorCoordinates();
        actions.onDetectionUpdated(state.buffer, coords || undefined);
      }
      return;
    }

    // Handle Escape
    if (state.active && e.key === 'Escape') {
      // console.log(`[MACRO-DETECTOR] 🚪 Escape pressed, cancelling detection`)
      const handled = actions.onCancelRequested()
      if (handled) {
        // console.log(`[MACRO-DETECTOR] ✅ Escape handled, preventing default`)
        e.preventDefault()
      }
      cancelDetection()
      return
    }

    // Handle commit keys in manual mode
    if (config.useCommitKeys && state.buffer && COMMIT_KEYS.has(e.key)) {
      // console.log(`[MACRO-DETECTOR] 🎯 COMMIT KEY DETECTED: "${e.key}" | Buffer: "${state.buffer}" | UseCommitKeys: ${config.useCommitKeys}`)
      
      // Ask action handler if they want to handle this
      const handled = actions.onCommitRequested(state.buffer)
      // console.log(`[MACRO-DETECTOR] 🎯 Commit request handled: ${handled}`)
      
      if (handled) {
        // console.log(`[MACRO-DETECTOR] ✅ Preventing default for commit key: ${e.key}`)
        e.preventDefault()
        // If the coordinator handled it, it means a selection was made from the overlay.
        // We need to commit the replacement here. The coordinator's job is just to
        // confirm the selection, not to trigger the replacement logic itself.
        const macroToCommit = getExact(state.buffer);
        if (macroToCommit) {
          // console.log(`[MACRO-DETECTOR] 🎯 Committing exact macro from overlay selection: ${macroToCommit.command}`)
          commitReplace(macroToCommit, sel, false)
        } else {
          // console.log(`[MACRO-DETECTOR] ⚠️  No exact macro found for buffer: "${state.buffer}"`)
        }
        // If no exact macro, do nothing (the coordinator might have done something else)
      } else {
        // console.log(`[MACRO-DETECTOR] 🎯 Overlay didn't handle commit, checking for exact match`)
        // If not handled by the overlay (e.g., it's not visible),
        // proceed with the default commit logic.
        if (isExact(state, macros)) {
          // console.log(`[MACRO-DETECTOR] ✅ Exact match found, committing and preventing default`)
          // If it's an exact match, we always handle it and prevent default.
          e.preventDefault()
          commitReplace(getExact(state.buffer)!, sel, false)
        } else {
          // If not an exact match, cancel detection and allow the key to be typed.
          cancelDetection()
        }
        // If not handled and not an exact match, we do nothing and let the
        // key (e.g., a space) be typed normally. The detector will now be cancelled.
        // itself on the next non-matching key.
      }
      return
    }

    // Handle Backspace
    if (e.key === "Backspace") {
      // console.log(`[MACRO-DETECTOR] ⌫ Backspace pressed | Before: active=${state.active}, buffer="${state.buffer}"`)
      clearTimer()
      const prevState = { ...state }
      
      // If detection was previously cancelled, we need to reconstruct the buffer
      // from the actual text content to properly handle backspace recovery
      let currentState = state
      if (!state.active && !state.buffer) {
        // Try to reconstruct the current typing context from the element
        const textContent = activeEl && 'value' in activeEl 
          ? activeEl.value 
          : activeEl?.textContent || ''
        const cursorPos = sel.start
        
        // Look backwards from cursor to find a potential macro prefix
        let reconstructedBuffer = ''
        for (let i = cursorPos - 1; i >= 0; i--) {
          const char = textContent[i]
          if (char === ' ' || char === '\n' || char === '\t') break
          reconstructedBuffer = char + reconstructedBuffer
          
          // Check if this looks like a macro buffer
          if (config.prefixes.some(prefix => reconstructedBuffer.startsWith(prefix))) {
            // console.log(`[MACRO-DETECTOR] ⌫ Reconstructed buffer from text: "${reconstructedBuffer}"`)
            currentState = { active: true, buffer: reconstructedBuffer }
            break
          }
        }
      }
      
      state = updateStateOnKey(currentState, e.key, macros, config.prefixes)
      // console.log(`[MACRO-DETECTOR] ⌫ After backspace: active=${state.active}, buffer="${state.buffer}" | Previous: active=${prevState.active}, buffer="${prevState.buffer}"`)
      
      if (state.active) {
        // console.log(`[MACRO-DETECTOR] ⌫ Detection still active, updating with buffer: "${state.buffer}"`)
        actions.onDetectionUpdated(state.buffer)
      } else {
        // console.log(`[MACRO-DETECTOR] ⌫ Detection became inactive, cancelling`)
        cancelDetection()
      }
      return
    }

    // Handle printable characters
    if (isPrintableKey(e)) {
      // console.log(`[MACRO-DETECTOR] 📝 Printable key: "${e.key}" | Before: active=${state.active}, buffer="${state.buffer}"`)
      const prevBuffer = state.buffer
      state = updateStateOnKey(state, e.key, macros, config.prefixes)
      // console.log(`[MACRO-DETECTOR] 📝 After update: active=${state.active}, buffer="${state.buffer}" | Mode: ${config.useCommitKeys ? 'MANUAL' : 'AUTO'}`)

      if (!config.useCommitKeys) {
        // console.log(`[MACRO-DETECTOR] 🤖 AUTOMATIC MODE`)
        // Automatic mode
        if (state.active) {
          const committedImmediately = scheduleConfirmIfExact(sel)
          // console.log(`[MACRO-DETECTOR] 🤖 Committed immediately: ${committedImmediately}`)
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
        // console.log(`[MACRO-DETECTOR] 👤 MANUAL MODE`)
        // Manual mode
        if (state.active) {
          if (prevStateActive) {
            // console.log(`[MACRO-DETECTOR] 👤 Detection continuing, updating buffer: "${state.buffer}"`)
            // Only get coordinates when updating, not on every key press
            const coords = getCursorCoordinates()
            actions.onDetectionUpdated(state.buffer, coords ?? undefined)
          } else {
            // console.log(`[MACRO-DETECTOR] 👤 Detection started, buffer: "${state.buffer}"`)
            // Only get coordinates when starting, not on every key press
            const coords = getCursorCoordinates()
            actions.onDetectionStarted(state.buffer, coords ?? undefined)
          }
        } else if (prevStateActive) {
          // console.log(`[MACRO-DETECTOR] 👤 Detection became inactive, cancelling`)
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
    // Add a small delay to prevent interference with Tab-triggered overlays
    // This allows the overlay to show without being immediately cancelled
    clearBlurTimer()
    blurTimer = window.setTimeout(() => {
      cancelDetection()
    }, 100) // 100ms delay should be enough for the overlay to establish itself
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
  }

  function initialize(): void {
    attachListeners()
    updateConfig()
    useMacroStore.subscribe(updateConfig)
  }

  function setMacros(newMacros: Macro[]): void {
    macros = [...SYSTEM_MACROS, ...newMacros]
    
    // If the actions object has setMacros method (like NewSuggestionsCoordinator), call it
    if ('setMacros' in actions && typeof actions.setMacros === 'function') {
      (actions as any).setMacros([...SYSTEM_MACROS, ...newMacros]);
    }
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
