import type { EditableEl, Macro } from '../../../types'
import type { PlaceholderSession } from '../placeholderSession'
import { isGoogleDocsSentinel } from '../replacement/editableUtils'
import { domBackend } from './domBackend'
import { googleDocsBackend } from './googleDocsBackend'

/**
 * An EditableBackend encapsulates the behavior the macro detector needs that
 * differs between a real DOM editable (input / textarea / contenteditable) and
 * the Google Docs capture iframe (reached via the sentinel element).
 *
 * The detector talks to this interface instead of branching on the sentinel.
 * `getBackend(el)` selects per element — selection is an element-level fact
 * (is THIS the Docs sentinel), not page-level (are we on docs.google.com),
 * because a Docs page can still host ordinary inputs that need the DOM backend.
 *
 * STAGING. The shadow buffer (Google Docs' typed-word mirror) is still owned by
 * the detector and mutated per-key there. To avoid splitting that single object's
 * ownership across two modules, every shadow-coupled method —
 * reconstructionSource, reset, and the unified handleKey — is deferred to stage 3,
 * where the shadow moves wholesale into googleDocsBackend. This file (stage 1)
 * carries only shadow-INDEPENDENT behavior. Range computation (commitRange /
 * overlayRange / insertionRange) arrives in stage 2.
 */
export interface EditableBackend {
  /**
   * True when a keydown should be ignored entirely (not fed to detection).
   * Google Docs ignores untrusted synthetic events (our own dispatches);
   * DOM ignores nothing.
   */
  shouldIgnoreEvent(e: KeyboardEvent): boolean

  /**
   * The text actually inserted for a macro. Google Docs inserts placeholder
   * labels only (stripped); DOM inserts raw macro text and lets the placeholder
   * session navigate the {{...}} syntax in place.
   */
  replacementTextFor(macro: Macro): string

  /** Restore focus to the editable before an at-cursor insertion. */
  focusForInsertion(el: EditableEl): void

  /** Create the placeholder navigation session appropriate to this backend. */
  createPlaceholderSession(
    el: EditableEl,
    text: string,
    onExit: () => void
  ): PlaceholderSession
}

/**
 * Selects the backend for a given element. Keyed on the sentinel, not on
 * isGoogleDocs(), so non-Docs editables on a Docs page resolve to DOM.
 */
export function getBackend(el: EditableEl): EditableBackend {
  return isGoogleDocsSentinel(el) ? googleDocsBackend : domBackend
}
