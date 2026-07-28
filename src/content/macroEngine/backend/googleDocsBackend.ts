import type { EditableEl, Macro } from '../../../types'
import type { EditableBackend, ReplacementRange, CommitRangeArgs } from './editableBackend'
import { createGoogleDocsPlaceholderSession } from '../googledocs/googleDocsPlaceholderSession'
import { isGoogleDocs, focusGoogleDocsEditor } from '../googledocs/googleDocsAdapter'
import { createShadowBuffer } from '../googledocs/shadowBuffer'
import { hasPlaceholders, stripPlaceholders } from '../replacement/placeholders'
import { isPrintableKey } from '../keyUtils'

/**
 * Backend for the Google Docs capture iframe, reached via the sentinel element.
 *
 * Owns the shadow buffer — Google Docs' mirror of the currently-typed word.
 * The sentinel element exposes no readable text, so backspace reconstruction
 * has nothing in the DOM to read; the shadow fills that role. The detector
 * feeds keystrokes via handleKey and reads reconstruction state via
 * reconstructionSource, never touching the buffer directly.
 *
 * Every range method collapses to the typed buffer or a zero-width insert,
 * because the sentinel exposes no readable cursor — buffer.length is the only
 * position information that exists.
 */
function createGoogleDocsBackend(): EditableBackend {
  const shadow = createShadowBuffer()

  return {
    // Our own deletion/insertion dispatches are untrusted; ignore them so they
    // don't re-enter detection. Real keystrokes are trusted.
    shouldIgnoreEvent(e: KeyboardEvent): boolean {
      return !e.isTrusted && isGoogleDocs()
    },

    reconstructionSource() {
      return { text: shadow.read(), cursorPos: shadow.length }
    },

    // Word boundaries (Enter, space, tab) reset the buffer; Backspace trims it;
    // other printable keys append. space/tab reset is handled inside
    // handlePrintable, so they route through the printable branch.
    handleKey(e: KeyboardEvent): void {
      if (e.key === 'Backspace') {
        shadow.backspace()
      } else if (e.key === 'Enter') {
        shadow.reset()
      } else if (isPrintableKey(e)) {
        shadow.handlePrintable(e.key)
      }
    },

    reset(): void {
      shadow.reset()
    },

    // Replacement runs in setTimeout(0); the trigger char must stay so the
    // deferred deletion covers the full buffer.
    defersTriggerChar(): boolean {
      return true
    },

    // The sentinel has no readable cursor or text, so every commit range is the
    // whole typed buffer. Deferred setTimeout(0) means the trigger char is
    // already in the doc by the time replaceInGoogleDocs fires, so buffer.length
    // covers it. adjusted range == undo range (no trim possible).
    commitRange(_el: EditableEl, args: CommitRangeArgs): ReplacementRange | null {
      const end = args.buffer.length
      return { start: 0, end, undoStart: 0, undoEnd: end }
    },

    parametricRange(_el, buffer): ReplacementRange {
      return { start: 0, end: buffer.length }
    },

    overlayRange(_el, buffer): ReplacementRange | null {
      return { start: 0, end: buffer.length }
    },

    // Insert-at-cursor: nothing to delete. Stated explicitly rather than relying
    // on the sentinel's virtual getCursorPosition() === 0.
    insertionRange(): ReplacementRange {
      return { start: 0, end: 0 }
    },

    // Google Docs inserts label-only text; the GDocs placeholder session then
    // navigates the cursor between labels (it cannot rely on {{...}} markers
    // surviving in the document model).
    replacementTextFor(macro: Macro): string {
      return hasPlaceholders(macro.text) ? stripPlaceholders(macro.text) : macro.text
    },

    focusForInsertion(): void {
      focusGoogleDocsEditor()
    },

    createPlaceholderSession(_el: EditableEl, text: string, onExit: () => void) {
      return createGoogleDocsPlaceholderSession(text, onExit)
    },
  }
}

export const googleDocsBackend = createGoogleDocsBackend()
