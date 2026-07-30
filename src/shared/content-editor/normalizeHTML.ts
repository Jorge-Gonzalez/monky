import { stripThemeAppearance } from '../macroAppearance'

const TAG_REPLACEMENTS: Record<string, string> = {
  b: 'strong',
  i: 'em',
  strike: 's',
}

function spanStyleToTag(style: string): string | null {
  const s = style.toLowerCase().replace(/\s/g, '')
  if (s.includes('font-weight:bold')) return 'strong'
  if (s.includes('font-style:italic')) return 'em'
  if (s.includes('text-decoration:underline')) return 'u'
  if (s.includes('text-decoration:line-through')) return 's'
  return null
}

function replaceTag(el: Element, newTag: string): void {
  const replacement = document.createElement(newTag)
  while (el.firstChild) replacement.appendChild(el.firstChild)
  el.parentNode!.replaceChild(replacement, el)
}

function unwrap(el: Element): void {
  const parent = el.parentNode!
  while (el.firstChild) parent.insertBefore(el.firstChild, el)
  parent.removeChild(el)
}

function normalizeElement(el: Element): void {
  Array.from(el.children).forEach((child) => normalizeElement(child))

  const tag = el.tagName.toLowerCase()

  if (tag in TAG_REPLACEMENTS) {
    replaceTag(el, TAG_REPLACEMENTS[tag])
    return
  }

  if (tag === 'font') {
    unwrap(el)
    return
  }

  if (tag === 'span') {
    const style = el.getAttribute('style') ?? ''
    const semanticTag = spanStyleToTag(style)
    if (semanticTag) {
      replaceTag(el, semanticTag)
    } else if (el.attributes.length === 0 || (el.attributes.length === 1 && style.trim() === '')) {
      unwrap(el)
    }
    return
  }

  if (el.getAttribute('style') === '') el.removeAttribute('style')
}

export function normalizeEditorHTML(html: string): string {
  if (!html) return html
  const div = document.createElement('div')
  // Theme-bearing colour goes first, before the span rules run. Order matters: a pasted
  // `<span style="font-weight: bold; color: #c00">` becomes a bare `<strong>` this way, whereas
  // colour-only spans collapse entirely instead of surviving as empty wrappers.
  div.innerHTML = stripThemeAppearance(html)
  Array.from(div.children).forEach((child) => normalizeElement(child))
  return div.innerHTML
}
