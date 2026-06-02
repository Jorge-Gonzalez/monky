import type { EditableEl, Macro } from '../../../types'
import type {
  EditableBackend,
  ReplacementRange,
  CommitRangeArgs,
} from './editableBackend'
import { createPlaceholderSession } from '../placeholderSession'

/**
 * Backend for real DOM editables: input, textarea, contenteditable.
 * The default path; behavior matches the detector's pre-split non-GDocs path.
 */
export const domBackend: EditableBackend = {
  // Real user input on a DOM element is always processed; nothing to filter.
  shouldIgnoreEvent(): boolean {
    return false
  },

  commitRange(_el: EditableEl, args: CommitRangeArgs): ReplacementRange | null {
    const { buffer, sel, selectionOnSchedule, isImmediate, prefixes, textContent } = args

    // Derive the raw range from the scheduled selection (delayed commit, cursor
    // has advanced past the trigger) or the live selection (immediate commit).
    let commandStart = 0
    let endPos = 0
    if (selectionOnSchedule && !isImmediate) {
      endPos = selectionOnSchedule.end + 1
      commandStart = Math.max(0, endPos - buffer.length)
    } else if (sel) {
      endPos = sel.end
      commandStart = Math.max(0, endPos - buffer.length)
    }

    // Pre-trim range is what undo restores to.
    const undoStart = commandStart
    const undoEnd = endPos

    // Trim a preceding space off the macro start: find the last configured
    // prefix within the candidate text and move commandStart to it.
    const macroText = textContent.substring(commandStart, endPos)
    let prefixIndex = -1
    for (const prefix of prefixes) {
      const idx = macroText.lastIndexOf(prefix)
      if (idx > prefixIndex) prefixIndex = idx
    }
    if (prefixIndex !== -1) {
      commandStart = commandStart + prefixIndex
    }

    // Invalid range → caller cancels. (The original detector also guarded
    // !sel && !selectionOnSchedule; that precondition stays in the detector
    // because it is about detection state, not range geometry.)
    if (commandStart < 0) return null

    return { start: commandStart, end: endPos, undoStart, undoEnd }
  },

  parametricRange(_el, buffer, sel): ReplacementRange {
    const endPos = sel.end
    const start = Math.max(0, endPos - buffer.length)
    return { start, end: endPos }
  },

  overlayRange(_el, buffer, textContent, cursorPos): ReplacementRange | null {
    const triggerIndex = textContent.lastIndexOf(buffer, cursorPos)
    if (triggerIndex === -1) return null
    return { start: triggerIndex, end: triggerIndex + buffer.length }
  },

  insertionRange(_el, cursorPos): ReplacementRange {
    return { start: cursorPos, end: cursorPos }
  },

  // DOM inserts the raw macro text; the placeholder session walks {{...}} in place.
  replacementTextFor(macro: Macro): string {
    return macro.text
  },

  focusForInsertion(el: EditableEl): void {
    el?.focus()
  },

  // DOM session ignores `text` — it reads placeholders from the element directly.
  createPlaceholderSession(el, _text, onExit) {
    return createPlaceholderSession(el, onExit)
  },
}
