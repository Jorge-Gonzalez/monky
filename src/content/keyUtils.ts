export function isPrintableKey(e: KeyboardEvent) {
  return !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1
}

export const UNSUPPORTED_KEYS = [
  "ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
  "Home","End","PageUp","PageDown","Escape","Delete"
]
