/**
 * Input and textarea replacement module.
 * Handles text replacements in HTMLInputElement and HTMLTextAreaElement.
 * For contenteditable elements, use plainTextReplacement.ts or richTextReplacement.ts instead.
 */

/**
 * Normalizes text for input elements by removing newlines and collapsing whitespace.
 * Input elements (type=text, email, etc.) are single-line and cannot contain newlines.
 * This function removes all newline characters and replaces multiple consecutive
 * whitespace characters with a single space.
 *
 * Note: We preserve leading/trailing spaces intentionally - they may be meaningful
 * in the replacement text (e.g., replacing "/" with " " should keep the space).
 *
 * @param text - Text that may contain newlines
 * @returns Text with newlines removed and whitespace normalized
 */
function normalizeForInputElement(text: string): string {
  // Remove all newline characters (\n, \r\n, \r) and replace with space
  // Then collapse multiple consecutive whitespace characters into a single space
  // Note: We don't use .trim() to preserve intentional leading/trailing spaces
  return text.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ')
}

/**
 * Replaces text in an input or textarea element with plain text.
 * Always uses plain text regardless of macro content type, since input/textarea
 * elements cannot contain HTML.
 *
 * For input elements (single-line), newlines are automatically normalized.
 * For textarea elements (multi-line), newlines are preserved.
 *
 * @param element - The input or textarea element
 * @param startPos - Start position in the value string
 * @param endPos - End position in the value string
 * @param replacementText - Plain text to insert
 * @returns true if replacement succeeded, false otherwise
 */
export function replaceInInput(
  element: HTMLInputElement | HTMLTextAreaElement,
  startPos: number,
  endPos: number,
  replacementText: string
): boolean {
  if (!element) {
    return false
  }

  // Security check: don't allow replacement in password fields
  if (element instanceof HTMLInputElement && element.type === 'password') {
    return false
  }

  try {
    const value = element.value
    const before = value.slice(0, startPos)
    const after = value.slice(endPos)

    // Normalize text for input elements (remove newlines and collapse whitespace)
    // Textarea elements can have newlines, so we preserve them
    const textToInsert = element instanceof HTMLInputElement
      ? normalizeForInputElement(replacementText)
      : replacementText

    // Perform the replacement
    element.value = before + textToInsert + after

    // Set cursor position after the inserted text
    const caretPosition = before.length + textToInsert.length
    element.setSelectionRange(caretPosition, caretPosition)

    return true
  } catch (error) {
    console.error('[InputTextReplacement] Error during replacement:', error)
    return false
  }
}

/**
 * Helper function to extract plain text from HTML content.
 * Used when a macro contains HTML but needs to be inserted into an input/textarea.
 *
 * @param html - HTML string to convert to plain text
 * @returns Plain text extracted from HTML
 */
export function htmlToPlainText(html: string): string {
  if (!html) return ''

  try {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ''
  } catch (error) {
    console.error('[InputTextReplacement] Error converting HTML to plain text:', error)
    return html // Return original HTML as fallback
  }
}

/**
 * Replaces text in an input/textarea element, automatically handling HTML-to-text conversion.
 * This is a convenience wrapper around replaceInInput that handles both plain text and HTML macros.
 *
 * @param element - The input or textarea element
 * @param startPos - Start position in the value string
 * @param endPos - End position in the value string
 * @param replacementText - Text to insert (can be plain text)
 * @param isHtml - Whether the replacement text is HTML that needs conversion
 * @returns true if replacement succeeded, false otherwise
 */
export function replaceInInputSmart(
  element: HTMLInputElement | HTMLTextAreaElement,
  startPos: number,
  endPos: number,
  replacementText: string,
  isHtml: boolean = false
): boolean {
  const textToInsert = isHtml ? htmlToPlainText(replacementText) : replacementText
  return replaceInInput(element, startPos, endPos, textToInsert)
}
