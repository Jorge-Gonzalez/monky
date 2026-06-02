import type { EditableEl, Macro } from '../../../types'
import type { EditableBackend } from './editableBackend'
import { createGoogleDocsPlaceholderSession } from '../googledocs/googleDocsPlaceholderSession'
import { isGoogleDocs, focusGoogleDocsEditor } from '../googledocs/googleDocsAdapter'
import { hasPlaceholders, stripPlaceholders } from '../replacement/placeholders'

/**
 * Backend for the Google Docs capture iframe, reached via the sentinel element.
 *
 * STAGE 1 carries only shadow-independent behavior. The shadow buffer remains
 * detector-owned until stage 3, when it moves here along with reconstructionSource,
 * reset, and the unified handleKey — so that the shadow's entire surface lives in
 * one module rather than being split across detector and backend mid-refactor.
 */
export const googleDocsBackend: EditableBackend = {
  // Our own deletion/insertion dispatches are untrusted; ignore them so they
  // don't re-enter detection. Real keystrokes are trusted.
  shouldIgnoreEvent(e: KeyboardEvent): boolean {
    return !e.isTrusted && isGoogleDocs()
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
