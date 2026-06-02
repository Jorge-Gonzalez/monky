import type { EditableEl, Macro } from '../../../types'
import type { EditableBackend } from './editableBackend'
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
