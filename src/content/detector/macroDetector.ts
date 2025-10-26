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

// Types for undo history
interface ReplacementHistoryEntry {
  element: EditableEl
  startPos: number
  endPos: number
  originalText: string
  replacementText: string
  macro: Macro
  timestamp: number
}

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

  // Undo history stack
  const undoHistory: ReplacementHistoryEntry[] = []
  const MAX_UNDO_HISTORY = 50 // Keep last 50 replacements

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

  function getExact(buffer: string): Macro | null {
    return macros.find(m => m.command === buffer) || null
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
   * Perform text replacement and track in history
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

    const textContent = getTextContent(element)
    const originalText = textContent.substring(startPos, endPos)

    // For undo, use the original range (before space adjustment) if provided
    const undoRange = {
      startPos: undoStartPos ?? startPos,
      endPos: undoEndPos ?? endPos,
      originalText: undoStartPos !== undefined && undoEndPos !== undefined 
        ? textContent.substring(undoStartPos, undoEndPos) 
        : originalText
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
    const historyEntry: ReplacementHistoryEntry = {
      element,
      startPos: undoRange.startPos,
      endPos: undoRange.endPos,
      originalText: undoRange.originalText,
      replacementText,
      macro,
      timestamp: Date.now()
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
   * Undo the last macro replacement
   */
  function undoLastReplacement(): boolean {
    if (undoHistory.length === 0 || !activeEl) return false

    // Find the index of the last entry for the active element
    let lastEntryIndex = -1
    for (let i = undoHistory.length - 1; i >= 0; i--) {
      if (undoHistory[i].element === activeEl) {
        lastEntryIndex = i
        break
      }
    }

    if (lastEntryIndex === -1) return false

    const lastEntry = undoHistory.splice(lastEntryIndex, 1)[0]
    if (!lastEntry) return false

    const { element, startPos, originalText, replacementText } = lastEntry

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
   * Clear undo history for a specific element or all
   */
  function clearUndoHistory(element?: EditableEl): void {
    if (element) {
      // Remove entries for specific element
      for (let i = undoHistory.length - 1; i >= 0; i--) {
        if (undoHistory[i].element === element) {
          undoHistory.splice(i, 1)
        }
      }
    } else {
      // Clear all history
      undoHistory.length = 0
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

    // Find the actual start of the macro (the '/' character) to avoid including preceding spaces
    const text = activeEl.textContent || ''
    const macroText = text.substring(commandStart, endPos)
    const slashIndex = macroText.lastIndexOf('/')
    
    if (slashIndex !== -1) {
      // Adjust commandStart to point to the '/' character, not any preceding space
      commandStart = commandStart + slashIndex
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
    performReplacement(activeEl, commandStart, endPos, macro.text, macro, originalCommandStart, originalEndPos)
    actions.onMacroCommitted(String(macro.id))
    cancelDetection()
  }

  function scheduleConfirmIfExact(sel: { start: number; end: number } | null): boolean {
    clearTimer()

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
    // Handle Ctrl+Z / Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      const editable = getActiveEditable(e.target)
      activeEl = editable // Set active element for undo context

      // Only handle undo if we have history for this element
      if (editable && undoHistory.some(entry => entry.element === editable)) {
        const undone = undoLastReplacement()

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
        e.preventDefault()
        const macroToCommit = getExact(state.buffer);
        if (macroToCommit) {
          commitReplace(macroToCommit, sel, false)
        }
      } else {
        if (isExact(state, macros)) {
          e.preventDefault()
          commitReplace(getExact(state.buffer)!, sel, false)
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
    clearUndoHistory()
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

  return {
    initialize,
    setMacros,
    getState,
    destroy: detachListeners,
    // Expose undo utilities for external use
    undoLastReplacement,
    clearUndoHistory,
    getUndoHistoryLength: () => undoHistory.length,
  }
}

export type MacroDetector = ReturnType<typeof createMacroDetector>