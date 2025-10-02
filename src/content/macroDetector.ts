import { useMacroStore } from "../store/useMacroStore"
import { updateStateOnKey, isExact } from "./detector-core"
import { getActiveEditable, getSelection, replaceText } from "./editableUtils"
import { Macro, CoreState, EditableEl } from "../types"
import { isPrintableKey, UNSUPPORTED_KEYS } from "./keyUtils"
import { defaultMacroConfig } from "../config/defaults"

const COMMIT_KEYS = new Set([" ", "Enter", "Tab"])
const CONFIRM_DELAY_MS = 1850

/**
 * This module manages the detection and replacement of macros in
 * editable elements on a webpage.
 *
 * It encapsulates the state and logic for:
 * - Listening to keyboard events.
 * - Tracking a buffer of user input to detect macro commands.
 * - Handling different replacement behaviors (automatic vs. manual).
 * - Managing timers for automatic replacements.
 * - Pausing detection on backspace to allow for corrections.
 */

// --- Module-level state ---
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

/**
 * Attaches the global keydown and blur event listeners.
 */
function attachListeners(): void {
  if (listenersAttached) return
  window.addEventListener("keydown", onKeyDown, true)
  window.addEventListener("blur", onBlur, true)
  listenersAttached = true
}
/**
 * Updates the internal configuration from the macro store.
 */
function updateConfig() {
  const storeConfig = useMacroStore.getState().config
  config = {
    useCommitKeys: storeConfig.useCommitKeys ?? false,
    prefixes: storeConfig.prefixes || defaultMacroConfig.prefixes,
    disabledSites: storeConfig.disabledSites || [],
  }
}

/**
 * Clears any pending auto-commit timer.
 */
function clearTimer() {
  if (timer > 0) {
    clearTimeout(timer)
    timer = 0
    selectionOnSchedule = null
  }
}

/**
 * Resets the detection state completely.
 */
function cancelDetection() {
  clearTimer()
  state = { active: false, buffer: "" }
}

/**
 * Finds a macro that exactly matches the given buffer.
 * @param buffer The input buffer to check.
 * @returns The matched macro or null.
 */
function getExact(buffer: string): Macro | null {
  return macros.find(m => m.command === buffer) || null
}

/**
 * Performs the text replacement for a matched macro.
 *
 * @param macro The macro to be inserted.
 * @param sel The current selection, used for manual and immediate commits.
 * @param isImmediate `true` if this is an immediate auto-commit.
 */
function commitReplace(macro: Macro, sel: { start: number; end: number } | null, isImmediate: boolean) {
  if (!activeEl) {
    return
  }

  let commandStart: number
  let endPos: number

  if (selectionOnSchedule && !isImmediate) {
    // Delayed auto-commit. The key has been inserted into the DOM.
    endPos = selectionOnSchedule.end + 1
    commandStart = endPos - state.buffer.length
  } else if (sel) {
    // Manual or Immediate commit. The key has NOT been inserted into the DOM yet.
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
  cancelDetection()
}

/**
 * Schedules an automatic macro replacement if the current buffer is an exact match.
 *
 * @param sel The current selection in the editable element.
 * @returns `true` if a replacement was committed immediately, `false` otherwise.
 */
function scheduleConfirmIfExact(sel: { start: number; end: number } | null): boolean {
  clearTimer()
  if (!isExact(state, macros)) return false

  const isPrefix = macros.some(m => m.command.startsWith(state.buffer) && m.command !== state.buffer)

  if (!isPrefix) {
    // If no other macros start with this command, commit immediately.
    commitReplace(getExact(state.buffer)!, sel, true)
    return true
  } else {
    // Otherwise, wait for a short delay to allow typing a longer macro.
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

/**
 * Main event handler for `keydown` events.
 */
export function onKeyDown(e: KeyboardEvent) {
  // This check is now a safeguard, as the listener should be detached.
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

  // --- Manual Mode: Check for commit keys ---
  if (config.useCommitKeys && state.buffer && COMMIT_KEYS.has(e.key)) {
    e.preventDefault()
    if (isExact(state, macros)) {
      commitReplace(getExact(state.buffer)!, sel, false)
    } else {
      cancelDetection()
    }
    return
  }

  // --- Backspace: Pause and correct ---
  if (e.key === "Backspace") {
    clearTimer() // "Pause" auto-commit
    state = updateStateOnKey(state, e.key, macros, config.prefixes)
    // Do not schedule a new timer, wait for the next printable key to "resume".
    return
  }

  // --- Printable characters: Update buffer and maybe commit ---
  if (isPrintableKey(e) && !COMMIT_KEYS.has(e.key)) {
    state = updateStateOnKey(state, e.key, macros, config.prefixes)

    if (!config.useCommitKeys) {
      if (state.active) {
        const committedImmediately = scheduleConfirmIfExact(sel)
        if (committedImmediately) {
          e.preventDefault()
        }
      } else {
        if (prevStateActive) clearTimer()
      }
    }
    return
  }

  // --- Other keys: Cancel detection ---
  if (UNSUPPORTED_KEYS.includes(e.key)) {
    cancelDetection()
  }
}

/**
 * Resets detection state when the user clicks away.
 */
export function onBlur() {
  cancelDetection()
}

/**
 * Initializes the macro detection service by attaching event listeners
 * and subscribing to config changes.
 */
export function initMacroDetector(): void {
  attachListeners()
  updateConfig()
  useMacroStore.subscribe(updateConfig)
}

/**
 * Updates the list of macros the detector works with.
 * @param newMacros The new list of macros.
 */
export function setDetectorMacros(newMacros: Macro[]): void {
  macros = newMacros
}

/**
 * Removes all event listeners set up by the macro detector.
 */
export function cleanupMacroDetector(): void {
  if (!listenersAttached) return
  window.removeEventListener("keydown", onKeyDown, true)
  window.removeEventListener("blur", onBlur, true)
  listenersAttached = false
  cancelDetection() // Ensure state is clean
}