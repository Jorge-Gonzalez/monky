export type Placeholder = { label: string; start: number; end: number }

export function parsePlaceholders(text: string): Placeholder[] {
  const re = /\{\{([^}]+)\}\}/g
  const results: Placeholder[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    results.push({ label: match[1], start: match.index, end: match.index + match[0].length })
  }
  return results
}

export function stripPlaceholders(text: string): string {
  return text.replace(/\{\{([^}]+)\}\}/g, '$1')
}

export function hasPlaceholders(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text)
}
