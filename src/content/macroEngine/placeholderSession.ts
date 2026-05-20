import { EditableEl } from '../../types'
import { getTextContent, findTextNodeForOffset } from './replacement/editableUtils'
import { parsePlaceholders } from './replacement/placeholders'
import { replacePlainText } from './replacement/plainTextReplacement'

function selectSpan(element: EditableEl, start: number, end: number): void {
  if (!element) return

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.focus()
    element.setSelectionRange(start, end)
    return
  }

  if (element instanceof HTMLElement) {
    const selection = window.getSelection()
    if (!selection) return
    const startTarget = findTextNodeForOffset(element, start)
    const endTarget = findTextNodeForOffset(element, end)
    if (!startTarget || !endTarget) return
    const range = document.createRange()
    range.setStart(startTarget.node, startTarget.offsetInNode)
    range.setEnd(endTarget.node, endTarget.offsetInNode)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

function stripRemainingPlaceholders(element: EditableEl): void {
  if (!element) return

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const stripped = element.value.replace(/\{\{([^}]+)\}\}/g, '$1')
    if (stripped !== element.value) {
      element.value = stripped
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }
    return
  }

  if (element instanceof HTMLElement) {
    const remaining = parsePlaceholders(element.textContent || '')
    // Process last-to-first so earlier positions stay valid after each replacement
    for (let i = remaining.length - 1; i >= 0; i--) {
      const { label, start, end } = remaining[i]
      replacePlainText(element, start, end, label)
    }
    if (remaining.length > 0) {
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
}

export function createPlaceholderSession(element: EditableEl, onExit: () => void) {
  let active = true
  let prefix = ''
  let suffix = ''

  function checkInvariant(): void {
    if (!active) return
    const text = getTextContent(element)
    const valid =
      text.length >= prefix.length + suffix.length &&
      text.startsWith(prefix) &&
      text.endsWith(suffix)
    if (!valid) { exit(); return }
    if (parsePlaceholders(text).length === 0) exit()
  }

  function exit(): void {
    if (!active) return
    active = false
    element?.removeEventListener('input', checkInvariant)
    element?.removeEventListener('blur', exit)
    stripRemainingPlaceholders(element)
    onExit()
  }

  function advance(): boolean {
    if (!active) return false
    const placeholders = parsePlaceholders(getTextContent(element))
    if (placeholders.length === 0) {
      exit()
      return false
    }
    const next = placeholders[0]
    const text = getTextContent(element)
    prefix = text.slice(0, next.start)
    suffix = text.slice(next.end)
    selectSpan(element, next.start, next.end)
    return true
  }

  element?.addEventListener('input', checkInvariant)
  element?.addEventListener('blur', exit)
  advance()

  return { advance, exit, isActive: () => active }
}

export type PlaceholderSession = ReturnType<typeof createPlaceholderSession>
