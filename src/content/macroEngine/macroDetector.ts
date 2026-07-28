import { useMacroStore } from '../../store/useMacroStore'
import { updateStateOnKey, isExact, getExact } from './detector-core'
import { getActiveEditable, getSelection, getCursorCoordinates } from './replacement/editableUtils'
import { replaceText } from './replacement/macroReplacement'
import type { Macro, CoreState, EditableEl } from '../../types'
import { isPrintableKey, UNSUPPORTED_KEYS } from './keyUtils'
import { defaultMacroConfig } from '../../config/defaults'
import {
  SYSTEM_MACROS,
  isSystemMacro,
  handleSystemMacro,
  parseParametricBuffer,
  handleParametricSystemCommand,
} from '../systemMacros/systemMacros'
import type { DetectorActions } from '../actions/detectorActions'
import { createMacroReplacement } from './replacement/macroReplacement'
import type { PlaceholderSession } from './placeholderSession'
import { hasPlaceholders } from './replacement/placeholders'
import {
  isGoogleDocs,
  attachToGoogleDocsIframe,
  isIntentionalFocusMove,
} from './googledocs/googleDocsAdapter'
import { getBackend, resetAllBackends } from './backend/editableBackend'
import type { ReplacementRange } from './backend/editableBackend'

const COMMIT_KEYS = new Set([' ', 'Enter'])
const CONFIRM_DELAY_MS = 1850

/**
 * Creates the core macro system that coordinates detection and replacement
 * This is the main entry point for the macro functionality
 */
export function createMacroDetector(actions: DetectorActions) {
  // Create replacement manager
  const replacement = createMacroReplacement()
  let placeholderSession: PlaceholderSession | null = null
  let macros: Macro[] = []
  let activeEl: EditableEl = null
  let state: CoreState = { active: false, buffer: '' }
  let timer: number = 0
  let selectionOnSchedule: { start: number; end: number } | null = null
  let listenersAttached = false
  let gdCleanup: (() => void) | null = null
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
    state = { active: false, buffer: '' }

    if (wasActive) {
      actions.onDetectionCancelled()
    }
  }

  function commitReplace(macro: Macro, sel: { start: number; end: number } | null, isImmediate: boolean) {
    if (!activeEl) {
      return
    }

    // Precondition about detection state (not range geometry): with neither a
    // live selection nor a scheduled one there is nothing to commit against.
    // Stays here rather than in the backend because it concerns detector state.
    if (!sel && !selectionOnSchedule) {
      cancelDetection()
      return
    }

    const range = getBackend(activeEl).commitRange(activeEl, {
      buffer: state.buffer,
      sel,
      selectionOnSchedule,
      isImmediate,
      prefixes: config.prefixes,
      textContent: replacement.getTextContent(activeEl),
    })

    // Invalid range (e.g. commandStart < 0) → cancel.
    if (!range) {
      cancelDetection()
      return
    }

    // commandStart/endPos used by the system-macro delete below; the regular
    // path passes the full range (incl. undo fields) to finishCommit.
    const { start: commandStart, end: endPos } = range

    getBackend(activeEl).reset()

    // Handle system macros (without undo tracking)
    if (isSystemMacro(macro)) {
      const deleteMacro: Macro = {
        id: 'temp-delete',
        command: '',
        text: '',
        contentType: 'text/plain',
      }
      replaceText(activeEl, deleteMacro, commandStart, endPos)
      handleSystemMacro(macro)
      actions.onMacroCommitted(String(macro.id))
      cancelDetection()
      return
    }

    // Regular macro: insert backend-selected text, commit, start placeholder session.
    finishCommit(activeEl, range, macro)
  }

  // Returns true when the buffer is a valid parametric system command or continuation.
  // e.g. ':edit', ':edit/', ':edit/nota' — but NOT ':editx'.
  function isParametricContinuation(buffer: string): boolean {
    for (const sm of SYSTEM_MACROS) {
      if (!sm.isParametric) continue
      if (!buffer.startsWith(sm.command)) continue
      const rest = buffer.slice(sm.command.length)
      if (!rest) return true
      if (config.prefixes.some((p) => rest.startsWith(p))) return true
    }
    return false
  }

  function commitParametricSystem(
    systemMacroId: string,
    param: string,
    sel: { start: number; end: number } | null
  ): void {
    if (!activeEl) return

    getBackend(activeEl).reset()

    const currentSel = sel || getSelection(activeEl)
    if (!currentSel) {
      cancelDetection()
      return
    }
    const { start: commandStart, end: endPos } = getBackend(activeEl).parametricRange(
      activeEl,
      state.buffer,
      currentSel
    )
    const deleteMacro: Macro = { id: 'temp-delete', command: '', text: '', contentType: 'text/plain' }
    replaceText(activeEl, deleteMacro, commandStart, endPos)
    handleParametricSystemCommand(systemMacroId, param)
    actions.onMacroCommitted(systemMacroId)
    cancelDetection()
  }

  function scheduleConfirmIfExact(sel: { start: number; end: number } | null): boolean {
    clearTimer()

    if (config.prefixes.includes(state.buffer)) return false

    // Parametric system commands: auto-commit when param matches a known macro,
    // using the same immediate/delayed logic as regular macros.
    const parametricResult = parseParametricBuffer(state.buffer, config.prefixes)
    if (parametricResult) {
      const paramTarget = macros.find((m) => m.command === parametricResult.param)
      if (!paramTarget) return false

      const isParamPrefix = macros.some(
        (m) =>
          !m.isSystemMacro &&
          m.command.startsWith(parametricResult.param) &&
          m.command !== parametricResult.param
      )

      if (!isParamPrefix) {
        commitParametricSystem(String(parametricResult.systemMacro.id), parametricResult.param, sel)
        return true
      } else {
        if (!sel) return false
        selectionOnSchedule = sel
        timer = window.setTimeout(() => {
          const current = parseParametricBuffer(state.buffer, config.prefixes)
          if (current && macros.find((m) => m.command === current.param) && activeEl) {
            commitParametricSystem(String(current.systemMacro.id), current.param, null)
          } else {
            cancelDetection()
          }
        }, CONFIRM_DELAY_MS)
        return false
      }
    }

    const exactMacro = getExact(state.buffer, macros)
    if (!exactMacro) return false
    if (exactMacro.isParametric) return false // wait for the parameter

    const isPrefix = macros.some((m) => m.command.startsWith(state.buffer) && m.command !== state.buffer)

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

  function startPlaceholderSession(el: EditableEl, text: string): void {
    if (!hasPlaceholders(text)) return
    placeholderSession = getBackend(el).createPlaceholderSession(el, text, () => {
      placeholderSession = null
    })
  }

  /**
   * Shared tail for the two "replace a typed trigger with macro text" commits:
   * commitReplace's regular-macro path and handleMacroSelectedFromOverlay. Both
   * insert the backend-selected text over `range`, commit, cancel detection, and
   * start a placeholder session for non-HTML macros. The range's undoStart/undoEnd
   * (present for commitReplace, absent for the overlay) flow through to
   * performReplacement's undo tracking.
   *
   * NOT used by commitParametricSystem (different op: replaceText + system action,
   * no undo) or handleMacroSelectedFromSearchOverlay (insert-at-cursor, no
   * cancelDetection — nothing was detecting).
   */
  function finishCommit(el: EditableEl, range: ReplacementRange, macro: Macro): void {
    const replacementText = getBackend(el).replacementTextFor(macro)
    replacement.performReplacement(
      el,
      range.start,
      range.end,
      replacementText,
      macro,
      range.undoStart,
      range.undoEnd
    )
    actions.onMacroCommitted(String(macro.id))
    cancelDetection()
    if (macro.contentType !== 'text/html') startPlaceholderSession(el, macro.text)
  }

  function onKeyDown(e: KeyboardEvent) {
    // Synthetic events dispatched by our own replaceInGoogleDocs (e.g. Backspace
    // events for deletion) must not re-enter detection. Real user input is always
    // trusted; our synthetic dispatches never are. Stays inline (not backend-
    // dispatched) because activeEl is not resolved at this point — there is no
    // element to call getBackend(el) on yet. The page-level isGoogleDocs() check
    // is the correct guard here; googleDocsBackend.shouldIgnoreEvent encodes the
    // identical rule for the element-resolved call sites.
    if (!e.isTrusted && isGoogleDocs()) return

    // The suggestions overlay has stolen focus to the guard element — it owns the
    // keyboard via useKeyboardNavigation. Don't interfere or cancel detection.
    if (isIntentionalFocusMove()) return

    // Placeholder mode owns the keydown — macro detection suppressed while active
    if (placeholderSession) {
      if (e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        placeholderSession.advance()
      } else if (e.key === 'Escape') {
        placeholderSession.exit()
      }
      return
    }

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
    if (
      state.active &&
      (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')
    ) {
      let direction: 'up' | 'down' | 'left' | 'right'
      if (e.key === 'ArrowUp') direction = 'up'
      else if (e.key === 'ArrowDown') direction = 'down'
      else if (e.key === 'ArrowLeft') direction = 'left'
      else direction = 'right'

      const handled = actions.onNavigationRequested(direction)
      if (handled) {
        e.preventDefault()
      }
      return
    }

    // Handle Tab key
    if (state.active && e.key === 'Tab') {
      if (actions.onNavigationRequested('right')) {
        e.preventDefault()
        return
      }

      // For parametric commands, Tab shows suggestions filtered by the current parameter
      const parametricResult = parseParametricBuffer(state.buffer, config.prefixes)
      if (parametricResult) {
        e.preventDefault()
        e.stopPropagation()
        clearBlurTimer()
        const coords = getCursorCoordinates()
        actions.onShowAllRequested(parametricResult.param, coords || undefined)
        return
      }

      e.preventDefault()
      e.stopPropagation()
      clearBlurTimer()

      if (actions.onShowAllRequested) {
        const coords = getCursorCoordinates()
        actions.onShowAllRequested(state.buffer, coords || undefined)
      } else {
        const coords = getCursorCoordinates()
        actions.onDetectionUpdated(state.buffer, coords || undefined)
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
      const parametricResult = parseParametricBuffer(state.buffer, config.prefixes)
      if (parametricResult) {
        e.preventDefault()
        commitParametricSystem(String(parametricResult.systemMacro.id), parametricResult.param, sel)
        return
      }
      const handled = actions.onCommitRequested(state.buffer)

      if (handled) {
        // Only prevent event and commit if we have an exact, non-parametric match.
        // Parametric macros need a parameter (e.g. :edit/cmd) — don't commit bare :edit.
        // If handled=true but no exact match, the overlay is visible and handles selection.
        const macroToCommit = getExact(state.buffer, macros)
        if (macroToCommit && !macroToCommit.isParametric) {
          e.preventDefault()
          commitReplace(macroToCommit, sel, false)
        }
        // If no exact match, let the event bubble to the overlay
      } else {
        const macroToCommit = getExact(state.buffer, macros)
        if (macroToCommit && !macroToCommit.isParametric) {
          e.preventDefault()
          commitReplace(macroToCommit, sel, false)
        } else {
          cancelDetection()
        }
      }
      return
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      clearTimer()

      let currentState = state
      if (!state.active && !state.buffer) {
        // Backend supplies the reconstruction source: DOM reads the live element,
        // Google Docs reads its shadow buffer (the sentinel has no readable text).
        // Read happens BEFORE handleKey below, so it reflects the pre-keystroke state.
        const { text: textToSearch, cursorPos } = getBackend(activeEl).reconstructionSource(activeEl, sel)

        let reconstructedBuffer = ''
        for (let i = cursorPos - 1; i >= 0; i--) {
          const char = textToSearch[i]
          if (char === ' ' || char === '\n' || char === '\t') break
          reconstructedBuffer = char + reconstructedBuffer

          if (config.prefixes.some((prefix) => reconstructedBuffer.startsWith(prefix))) {
            currentState = { active: true, buffer: reconstructedBuffer }
            break
          }
        }
      }

      state = updateStateOnKey(currentState, e.key, macros, [...config.prefixes, ':'])

      if (!state.active && isParametricContinuation(state.buffer)) {
        state = { active: true, buffer: state.buffer }
      }

      getBackend(activeEl).handleKey(e)

      if (state.active) {
        actions.onDetectionUpdated(state.buffer)
      } else {
        cancelDetection()
      }
      return
    }

    // Word-boundary keys (Enter here; space/tab/backspace handled in their own
    // branches) update backend input state. Fires before the parametric-commit
    // return below, matching the original reset-before-return ordering.
    if (e.key === 'Enter') {
      getBackend(activeEl).handleKey(e)
    }

    // Auto mode: Enter commits parametric system commands.
    // Enter is not printable (length > 1) so it never reaches the isPrintableKey block.
    if (!config.useCommitKeys && state.active && e.key === 'Enter') {
      const parametricResult = parseParametricBuffer(state.buffer, config.prefixes)
      if (parametricResult) {
        e.preventDefault()
        commitParametricSystem(String(parametricResult.systemMacro.id), parametricResult.param, sel)
        return
      }
    }

    // Handle printable characters
    if (isPrintableKey(e)) {
      const effectivePrefixes = [...config.prefixes, ':']

      // Parametric commit: Space/Enter while buffer is a complete parametric command
      if (state.active && COMMIT_KEYS.has(e.key)) {
        const parametricResult = parseParametricBuffer(state.buffer, config.prefixes)
        if (parametricResult) {
          e.preventDefault()
          commitParametricSystem(String(parametricResult.systemMacro.id), parametricResult.param, sel)
          return
        }
      }

      state = updateStateOnKey(state, e.key, macros, effectivePrefixes)

      // Keep active for valid parametric continuations that updateStateOnKey killed
      if (!state.active && isParametricContinuation(state.buffer)) {
        state = { active: true, buffer: state.buffer }
      }

      if (!config.useCommitKeys) {
        if (state.active) {
          const committedImmediately = scheduleConfirmIfExact(sel)
          if (committedImmediately && !getBackend(activeEl).defersTriggerChar()) {
            // In immediate mode, prevent the character from being added to avoid duplication.
            // Skip when the backend defers the trigger char: Google Docs' replacement
            // runs in setTimeout(0) and needs the trigger char already inserted so the
            // deferred deletion covers the full buffer.
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

      // Backend updates input state for this printable key. Stays LAST in the
      // branch (post-detection-logic) so reconstruction reads see the pre-key
      // state — the read/write ordering preserved across the refactor.
      getBackend(activeEl).handleKey(e)
      return
    }

    // Other keys cancel detection
    if (UNSUPPORTED_KEYS.includes(e.key)) {
      getBackend(activeEl).reset()
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
    // Blur was caused by our own intentional focus move (stealing focus for the
    // overlay, or restoring it back) — don't cancel detection.
    if (isIntentionalFocusMove()) return
    getBackend(activeEl).reset()
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
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('blur', onBlur, true)
    if (isGoogleDocs()) {
      gdCleanup = attachToGoogleDocsIframe(onKeyDown, onBlur)
    }
    listenersAttached = true
  }

  function detachListeners(): void {
    if (!listenersAttached) return
    window.removeEventListener('keydown', onKeyDown, true)
    window.removeEventListener('blur', onBlur, true)
    gdCleanup?.()
    gdCleanup = null
    listenersAttached = false
    clearBlurTimer()
    placeholderSession?.exit()
    placeholderSession = null
    resetAllBackends()
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

    // Some action sets also mirror the macro list; forward to them when present.
    const mirror = actions as DetectorActions & { setMacros?: (macros: Macro[]) => void }
    if (typeof mirror.setMacros === 'function') {
      mirror.setMacros([...SYSTEM_MACROS, ...newMacros])
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

    getBackend(targetEl).reset()

    const textContent = replacement.getTextContent(targetEl)
    const cursorPos = replacement.getCursorPosition(targetEl)

    if (cursorPos === null) {
      return
    }

    const range = getBackend(targetEl).overlayRange(targetEl, buffer, textContent, cursorPos)
    if (!range) return

    finishCommit(targetEl, range, macro)
  }

  /**
   * Handle macro selection from search overlay (inserts at cursor position)
   */
  function handleMacroSelectedFromSearchOverlay(macro: Macro, element: EditableEl): void {
    if (!element) {
      return
    }

    const backend = getBackend(element)
    backend.reset()
    backend.focusForInsertion(element)

    // Backend selects insert text: GDocs strips placeholders, DOM uses raw text.
    const replacementText = backend.replacementTextFor(macro)

    const cursorPos = replacement.getCursorPosition(element)

    if (cursorPos === null) {
      return
    }

    const { start, end } = backend.insertionRange(element, cursorPos)
    replacement.performReplacement(element, start, end, replacementText, macro)

    actions.onMacroCommitted(String(macro.id))
    if (macro.contentType !== 'text/html') startPlaceholderSession(element, macro.text)
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
