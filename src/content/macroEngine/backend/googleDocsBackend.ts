import type { EditableEl, Macro } from '../../../types'
import type {
  EditableBackend,
  ReplacementRange,
  CommitRangeArgs,
} from './editableBackend'
import { createGoogleDocsPlaceholderSession } from '../googledocs/googleDocsPlaceholderSession'
import { isGoogleDocs, focusGoogleDocsEditor } from '../googledocs/googleDocsAdapter'
import { hasPlaceholders, stripPlaceholders } from '../replacement/placeholders'

/**
 * Backend for the Google Docs capture iframe, reached via the sentinel element.
 *
 * Every range method collapses to the typed buffer or a zero-width insert,
 * because the sentinel exposes no readable cursor or text — buffer.length is
 * the only position information that exists.
 *
 * Still deferred to stage 3: the shadow buffer (reconstructionSource, reset,
 * the unified handleKey) moves here wholesale then, so the shadow's entire
 * surface lives in one module rather than being split mid-refactor.
 */
export const googleDocsBackend: EditableBackend = {
  // Our own deletion/insertion dispatches are untrusted; ignore them so they
  // don't re-enter detection. Real keystrokes are trusted.
  shouldIgnoreEvent(e: KeyboardEvent): boolean {
    return !e.isTrusted && isGoogleDocs()
  },

  // The sentinel has no readable cursor or text, so every commit range is the
  // whole typed buffer. Deferred setTimeout(0) means the trigger char is already
  // in the doc by the time replaceInGoogleDocs fires, so buffer.length covers it.
  // adjusted range == undo range (no trim possible).
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
