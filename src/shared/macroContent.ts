// Structure counts as formatting. The first version listed only inline tags, so a paste made of a
// heading and paragraphs -- an article, the ordinary case -- answered `false`, was stored as
// `text/plain`, and lost its structure on the way in.
//
// `p` and `div` are deliberately absent, and that is the line this draws. Both are generic line
// wrappers rather than formatting: Chrome puts a `div` around every typed line, a pasted paragraph
// of unadorned prose is a `p`, and in both cases the plain-text path already carries the breaks.
// Counting them would push simple text macros down the rich path, which inserts the wrapper into
// the host and adds block spacing nobody asked for. A heading, a list, a quote or any inline
// emphasis says something plain text cannot.
//
// `\b` rather than `\s` so `<a>` counts alongside `<a href=...>`, and `<h2>` alongside `<h2
// style=...>`.
const RICH_ELEMENTS =
  /<(?:strong|b|em|i|u|s|mark|code|sub|sup|a|span|br|hr|ul|ol|li|blockquote|pre|h[1-6]|table|thead|tbody|tr|td|th)\b/i

export function hasRichFormatting(html: string): boolean {
  return RICH_ELEMENTS.test(html)
}

function traverse(node: Node, acc: string, listCounters: number[]): string {
  if (node.nodeType === Node.TEXT_NODE) {
    let textContent = node.textContent?.replace(/\s+/g, ' ') || ''
    const blockquote = (node.parentElement as HTMLElement)?.closest('blockquote')
    if (blockquote) {
      textContent = textContent
        .split('\n')
        .map((line) => (line.trim() ? `> ${line}` : line))
        .join('\n')
    }
    return acc + textContent
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return acc

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const isBlock = ['div', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'].includes(tag)
  const isList = ['ul', 'ol'].includes(tag)
  const isListItem = tag === 'li'

  if (tag === 'br') return acc + '\n'

  if (isList) {
    if (acc.length > 0 && !acc.endsWith('\n')) acc += '\n'
    if (tag === 'ol') listCounters.push(1)
  } else if (tag === 'blockquote') {
    if (acc.length > 0 && !acc.endsWith('\n')) acc += '\n'
  } else if (isListItem) {
    if (acc.length > 0 && !acc.endsWith('\n')) acc += '\n'
    const parentTag = el.parentElement?.tagName.toLowerCase()
    if (parentTag === 'ol') {
      const counter = listCounters[listCounters.length - 1]
      listCounters[listCounters.length - 1]++
      acc += `${counter}. `
    } else {
      acc += '• '
    }
  } else if (isBlock) {
    if (acc.length > 0 && !acc.endsWith('\n')) acc += '\n'
  }

  for (const child of Array.from(el.childNodes)) {
    acc = traverse(child, acc, listCounters)
  }

  if (isList) {
    if (tag === 'ol') listCounters.pop()
    if (!acc.endsWith('\n')) acc += '\n'
    if (!acc.endsWith('\n\n')) acc += '\n'
  } else if (tag === 'blockquote') {
    if (!acc.endsWith('\n')) acc += '\n'
    if (!acc.endsWith('\n\n')) acc += '\n'
  } else if (isBlock && !isListItem) {
    if (!acc.endsWith('\n')) acc += '\n'
    if (tag === 'p' && !acc.endsWith('\n\n')) acc += '\n'
  }

  return acc
}

export function extractPlainText(html: string): string {
  const tempEl = document.createElement('div')
  tempEl.innerHTML = html
  return traverse(tempEl, '', [])
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
