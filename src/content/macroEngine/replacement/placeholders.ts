export type Placeholder = { label: string; start: number; end: number }
export type TextSegment = { text: string; isPlaceholder: boolean }

export function parsePlaceholders(text: string): Placeholder[] {
  const re = /\{\{([^}]+)\}\}/g
  const results: Placeholder[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    results.push({ label: match[1], start: match.index, end: match.index + match[0].length })
  }
  return results
}

/** Cuts text into its literal runs and placeholder labels, in source order. */
export function splitPlaceholders(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let cursor = 0
  for (const { label, start, end } of parsePlaceholders(text)) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), isPlaceholder: false })
    segments.push({ text: label, isPlaceholder: true })
    cursor = end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), isPlaceholder: false })
  return segments
}

export function stripPlaceholders(text: string): string {
  return text.replace(/\{\{([^}]+)\}\}/g, '$1')
}

export function hasPlaceholders(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text)
}
