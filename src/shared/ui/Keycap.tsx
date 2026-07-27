import type { ReactNode } from 'react'

/**
 * A single key in a keyboard hint. The same paragraph appeared eight times across the
 * suggestions overlay and the delete-confirm popup, which is what makes it a component
 * rather than a repeated sentence.
 */
export function Keycap({ children }: { children: ReactNode }) {
  return (
    <kbd data-component="keycap" className="sf-keycap
      ground-subtle ink rule corner-sm ruled font-xs font-mono">
      {children}
    </kbd>
  )
}
