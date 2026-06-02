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
 * The shadow buffer (Google Docs' typed-word mirror, needed because the sentinel
 * exposes no readable text) is owned entirely by googleDocsBackend. The detector
 * holds no Google Docs state and does not branch on the sentinel; it feeds every
 * keystroke to handleKey and reads reconstruction state through the backend.
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
   * Source text + cursor position for buffer reconstruction when the user
   * backspaces into a previously-typed word. DOM reads the element's value /
   * textContent and the live caret offset; GDocs reads its shadow buffer (the
   * sentinel exposes no readable text). Called BEFORE handleKey so the read
   * reflects the pre-keystroke state.
   */
  reconstructionSource(
    el: EditableEl,
    sel: { start: number; end: number }
  ): { text: string; cursorPos: number }

  /**
   * Update per-backend input state for a keystroke. DOM is a no-op (it reads
   * the live element). GDocs drives its shadow buffer: word-boundary keys
   * (space, tab, Enter) reset it, Backspace trims it, other printable keys
   * append. Called at the END of the printable / backspace handling so the
   * shadow reflects the post-keystroke state (paired with reconstructionSource,
   * which must run first).
   */
  handleKey(e: KeyboardEvent): void

  /** Clear per-backend input state (shadow buffer). No-op for DOM. */
  reset(): void

  /**
   * True when the backend defers macro replacement past the current keydown
   * (so the trigger char must NOT be preventDefault'd in immediate-commit mode).
   * Google Docs replaces in setTimeout(0) and needs the trigger char inserted
   * first; DOM replaces synchronously and prevents the duplicate char.
   */
  defersTriggerChar(): boolean

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

/**
 * Reset input state across all backends, for teardown where no element is in
 * scope. googleDocsBackend is a module singleton that outlives detector
 * instances, so its shadow buffer must be cleared explicitly on detach;
 * otherwise a re-initialized detector would inherit a stale buffer.
 */
export function resetAllBackends(): void {
  domBackend.reset()
  googleDocsBackend.reset()
}
