/**
 * Tracks characters typed in Google Docs since the last word boundary.
 * Used for buffer reconstruction on backspace, since the sentinel element
 * has no readable text content (unlike real input/contenteditable elements).
 */
export function createShadowBuffer() {
  let buffer = ''

  return {
    /** Append key, or reset on space/tab (word boundary). */
    handlePrintable(key: string): void {
      if (key === ' ' || key === '\t') {
        buffer = ''
      } else {
        buffer += key
      }
    },

    /** Remove the last character. No-op on empty buffer. */
    backspace(): void {
      buffer = buffer.slice(0, -1)
    },

    /** Clear the buffer (commit, blur, enter, unsupported key). */
    reset(): void {
      buffer = ''
    },

    /** Return the current buffer string. */
    read(): string {
      return buffer
    },

    get length(): number {
      return buffer.length
    },
  }
}

export type ShadowBuffer = ReturnType<typeof createShadowBuffer>
