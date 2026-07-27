import type { ReactNode } from 'react'

/**
 * A single key in a keyboard hint. The same paragraph appeared eight times across the
 * suggestions overlay and the delete-confirm popup, which is what makes it a component
 * rather than a repeated sentence.
 *
 * `raised` is the modal footer's treatment: the same key, drawn to sit above the footer's
 * own ground rather than inside a panel. It appeared ten more times on its own.
 */
export function Keycap({ children, raised }: { children: ReactNode; raised?: boolean }) {
  return raised ? (
    <kbd data-component="keycap" className="sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative
      ground ink-soft rule-soft ruled font-xs font-mono">{children}</kbd>
  ) : (
    <kbd data-component="keycap" className="sf-keycap
      ground-subtle ink rule corner-sm ruled font-xs font-mono">{children}</kbd>
  )
}

interface ShortcutHintProps {
  /** One or more keys, drawn adjacent with no gap: ↑↓ reads as one control. */
  keys: string[]
  label: string
  /** The last hint in a row carries no trailing margin. */
  last?: boolean
}

/** A key or key pair with the action it performs, as the modal footer lists them. */
export function ShortcutHint({ keys, label, last }: ShortcutHintProps) {
  return (
    <span className={`horizontal inline gap-sm align-center ${last ? '' : 'margin-right-lg'}`}>
      {keys.map(key => <Keycap key={key} raised>{key}</Keycap>)}
      {' '}{label}
    </span>
  )
}
