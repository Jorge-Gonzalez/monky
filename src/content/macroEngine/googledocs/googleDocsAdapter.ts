/**
 * Google Docs captures keyboard input through a hidden same-origin iframe
 * (.docs-texteventtarget-iframe, src="about:blank"). Keyboard events fire
 * inside that iframe and never bubble to the parent window, so we attach our
 * listeners directly to its contentWindow.
 *
 * Replacement uses execCommand on the iframe's contentDocument, which fires
 * the input events that Google Docs processes to update its own model.
 */

const IFRAME_SELECTOR = '.docs-texteventtarget-iframe'

export function isGoogleDocs(): boolean {
  return window.location.hostname === 'docs.google.com'
}

function getIframe(): HTMLIFrameElement | null {
  return document.querySelector(IFRAME_SELECTOR)
}

/**
 * Attaches keydown/blur listeners to the Google Docs input capture iframe.
 * Returns a cleanup function, or null if the iframe is not accessible.
 */
export function attachToGoogleDocsIframe(
  keydown: (e: KeyboardEvent) => void,
  blur: () => void
): (() => void) | null {
  const cw = getIframe()?.contentWindow
  if (!cw) return null

  cw.addEventListener('keydown', keydown, true)
  cw.addEventListener('blur', blur, true)

  return () => {
    cw.removeEventListener('keydown', keydown, true)
    cw.removeEventListener('blur', blur, true)
  }
}

export function focusGoogleDocsEditor(): void {
  getIframe()?.contentWindow?.focus()
}

/**
 * Replaces text in Google Docs.
 *
 * Deferred via setTimeout(0) so that Google Docs finishes processing the current
 * keydown event (including the trigger character insertion) before we act. This
 * means the caller must NOT call e.preventDefault() for the trigger character —
 * we let Google Docs insert it, then delete it along with the rest of the buffer.
 *
 * Deletion: synthetic Backspace keydown events. Google Docs' own keydown handler
 * processes these and removes characters from its document model.
 * execCommand('delete') is a no-op because the iframe input element is cleared by
 * Google Docs after every keystroke — chars live in its internal model, not the DOM.
 *
 * Insertion: execCommand('insertText') fires an input event on the iframe's editable
 * that Google Docs reads and inserts into the document.
 */
export function replaceInGoogleDocs(deleteCount: number, text: string): void {
  window.setTimeout(() => {
    const doc = getIframe()?.contentDocument
    if (!doc) return

    const target = doc.activeElement ?? doc.body

    for (let i = 0; i < deleteCount; i++) {
      target.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Backspace',
        code: 'Backspace',
        keyCode: 8,
        charCode: 0,
        bubbles: true,
        cancelable: true,
      }))
    }

    // Insert via keypress events. The event log confirms Google Docs reads
    // charCode from keypress to insert characters — no beforeinput/input
    // events fire for real typing, so that pipeline is irrelevant here.
    for (const char of text) {
      const isNewline = char === '\n'
      target.dispatchEvent(new KeyboardEvent('keypress', {
        key: isNewline ? 'Enter' : char,
        charCode: isNewline ? 13 : char.charCodeAt(0),
        keyCode: isNewline ? 13 : char.charCodeAt(0),
        which: isNewline ? 13 : char.charCodeAt(0),
        bubbles: true,
        cancelable: true,
      }))
    }
  }, 0)
}
