import { parsePlaceholders, stripPlaceholders } from '../replacement/placeholders'
import { navigateInGoogleDocs } from './googleDocsAdapter'

/**
 * Computes each placeholder's position inside the stripped text (labels only,
 * no {{ }}). Each removed {{...}} saves 4 chars ('{{' + '}}'), shifting every
 * subsequent placeholder's start index by that cumulative amount.
 */
function strippedPositions(macroText: string) {
  const placeholders = parsePlaceholders(macroText)
  let offset = 0
  return placeholders.map(p => {
    const start = p.start - offset
    const end = start + p.label.length
    offset += 4
    return { start, end, label: p.label }
  })
}

/**
 * Placeholder session for Google Docs.
 *
 * After the stripped macro text is inserted (cursor at end), we schedule
 * ArrowLeft moves to reach the first placeholder label and Shift+ArrowLeft
 * to select it. On each Tab advance, ArrowRight moves skip the inter-label
 * text (whose length is fixed regardless of what the user typed for the
 * previous label), then Shift+ArrowRight selects the next label.
 *
 * All navigation is dispatched via keydown events to the iframe — the same
 * mechanism used by replaceInGoogleDocs.
 */
export function createGoogleDocsPlaceholderSession(macroText: string, onExit: () => void) {
  const stripped = stripPlaceholders(macroText)
  const positions = strippedPositions(macroText)

  let currentIndex = 0
  let active = true

  function navigateToFirst(): void {
    const p = positions[0]
    const charsAfter = stripped.length - p.end
    const labelLen = p.end - p.start
    // Cursor is at end of inserted text; move left past trailing text, then
    // extend selection left over the label.
    window.setTimeout(() => {
      navigateInGoogleDocs([
        { key: 'ArrowLeft', shift: false, count: charsAfter },
        { key: 'ArrowLeft', shift: true,  count: labelLen  },
      ])
    }, 0)
  }

  function navigateToNext(index: number): void {
    const prev = positions[index - 1]
    const curr = positions[index]
    // Inter-text length from end of previous label to start of current label.
    // This offset is invariant to what the user typed for the previous label
    // because both the cursor and the target shift by the same delta.
    const interLen = curr.start - prev.end
    const labelLen = curr.end - curr.start
    window.setTimeout(() => {
      navigateInGoogleDocs([
        { key: 'ArrowRight', shift: false, count: interLen },
        { key: 'ArrowRight', shift: true,  count: labelLen },
      ])
    }, 0)
  }

  function advance(): boolean {
    if (!active) return false
    currentIndex++
    if (currentIndex >= positions.length) {
      exit()
      return false
    }
    navigateToNext(currentIndex)
    return true
  }

  function exit(): void {
    if (!active) return
    active = false
    onExit()
  }

  // Navigate to the first placeholder in the next tick, after the insertion
  // setTimeout from replaceInGoogleDocs has already fired.
  navigateToFirst()

  return { advance, exit, isActive: () => active }
}
