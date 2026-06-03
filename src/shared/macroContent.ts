export function hasRichFormatting(html: string): boolean {
  const richElements = /<(?:strong|b|em|i|u|ul|ol|li|br|a\s|span\s)/i
  return richElements.test(html) || html.includes('<br')
}

function traverse(node: Node, acc: string, listCounters: number[]): string {
  if (node.nodeType === Node.TEXT_NODE) {
    let textContent = node.textContent?.replace(/\s+/g, ' ') || ''
    const blockquote = (node.parentElement as HTMLElement)?.closest('blockquote')
    if (blockquote) {
      textContent = textContent.split('\n').map(line =>
        line.trim() ? `> ${line}` : line
      ).join('\n')
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
  return traverse(tempEl, '', []).replace(/\n{3,}/g, '\n\n').trim()
}
