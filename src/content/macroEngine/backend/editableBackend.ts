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
 * where the shadow moves wholesale into googleDocsBackend. Stage 1 carried the
 * shadow-INDEPENDENT behavior; stage 2 (this change) adds range computation
 * (commitRange / parametricRange / overlayRange / insertionRange).
 */
/** A replacement range. undoStart/undoEnd carry the pre-trim range that
 *  commitReplace tracks separately for undo; the other range methods omit them. */
export interface ReplacementRange {
  start: number
  end: number
  undoStart?: number
  undoEnd?: number
}

/** Inputs commitRange needs to reproduce commitReplace's position logic. */
export interface CommitRangeArgs {
  buffer: string
  sel: { start: number; end: number } | null
  selectionOnSchedule: { start: number; end: number } | null
  isImmediate: boolean
  /** Configured prefixes, passed per-call. Only the DOM backend uses them
   *  (to trim a preceding space off the macro start); GDocs ignores them. */
  prefixes: string[]
  /** Live text content of the element, for the DOM prefix-trim. Empty for GDocs. */
  textContent: string
}

export interface EditableBackend {
  /**
   * True when a keydown should be ignored entirely (not fed to detection).
   * Google Docs ignores untrusted synthetic events (our own dispatches);
   * DOM ignores nothing.
   */
  shouldIgnoreEvent(e: KeyboardEvent): boolean

  /**
   * Range for a regular/system macro commit (the commitReplace path).
   * DOM derives it from the cursor/selection and trims a leading space off the
   * macro start, tracking the pre-trim range for undo. GDocs has no readable
   * cursor, so the range is the whole typed buffer: [0, buffer.length].
   * Returns null when the range is invalid (caller cancels detection).
   */
  commitRange(el: EditableEl, args: CommitRangeArgs): ReplacementRange | null

  /**
   * Range for a parametric system command (the commitParametricSystem path).
   * No prefix-trim, no undo — the command buffer is consumed wholesale.
   * DOM: [max(0, end - buffer.length), end]. GDocs: [0, buffer.length].
   */
  parametricRange(
    el: EditableEl,
    buffer: string,
    sel: { start: number; end: number }
  ): ReplacementRange

  /**
   * Range for a macro picked from the suggestions overlay (replaces the typed
   * trigger). DOM: locate the buffer via lastIndexOf and replace it; returns
   * null if not found. GDocs: text content is empty, so [0, buffer.length].
   */
  overlayRange(
    el: EditableEl,
    buffer: string,
    textContent: string,
    cursorPos: number
  ): ReplacementRange | null

  /**
   * Range for a macro picked from the search modal (inserts at cursor, deletes
   * nothing). DOM: [cursorPos, cursorPos]. GDocs: [0, 0] — the sentinel's
   * getCursorPosition is a virtual 0, so this states the insert-at-cursor
   * intent explicitly rather than relying on that coincidence.
   */
  insertionRange(el: EditableEl, cursorPos: number): ReplacementRange

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
