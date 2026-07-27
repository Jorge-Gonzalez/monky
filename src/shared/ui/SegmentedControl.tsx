import type { ReactNode } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  // Needed when the label is an icon with no text, for screen readers.
  ariaLabel?: string
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedIndex = options.findIndex(o => o.value === value)
  const prevIndex = useRef(selectedIndex)
  const [sliding, setSliding] = useState(false)

  // The selected button owns its background, so its geometry is always correct.
  // The pill is a transient overlay: on a real selection change it slides from the
  // old button to the new one, then hides. That way a later width change (switching
  // language relabels the buttons) can never leave a stale pill overhanging — there
  // is no pill to mismatch when nothing is sliding.
  useLayoutEffect(() => {
    if (prevIndex.current === selectedIndex) return
    const container = containerRef.current
    if (!container) return
    const buttons = container.querySelectorAll<HTMLElement>('[role="radio"]')
    const from = buttons[prevIndex.current]
    const to = buttons[selectedIndex]
    prevIndex.current = selectedIndex
    if (!from || !to) return

    const placePill = (b: HTMLElement) => {
      container.style.setProperty('--pill-left', `${b.offsetLeft}px`)
      container.style.setProperty('--pill-width', `${b.offsetWidth}px`)
    }

    // Snap the pill onto the old button, reveal it, then slide to the new one.
    container.classList.add('seg-snap')
    placePill(from)
    setSliding(true)
    requestAnimationFrame(() => {
      container.classList.remove('seg-snap')
      placePill(to)
    })
  }, [selectedIndex])

  return (
    <div
      ref={containerRef}
      className={`sf-segmented-pill horizontal hidden position-relative ground-subtle rule corner-md ruled ${sliding ? 'is-sliding' : ''}`}
      role="radiogroup"
      onTransitionEnd={e => {
        // Only the pill's own (::before) transition lands on the container; button
        // colour transitions originate on the buttons. End of slide → hand the
        // background back to the button and hide the pill.
        if (e.target === containerRef.current) setSliding(false)
      }}
    >
      {options.map((opt, index) => {
        const checked = opt.value === value
        const drawRightRule = !checked && index < options.length - 1
        return (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          aria-label={opt.ariaLabel}
          className={`sf-segmented-control-option elastic basis-ratio padding-block-xs padding-inline-md content position-relative selectable ink-soft rule text-nowrap ${drawRightRule ? 'ruled-right ' : ''}font-sm text-center pressable tween-ink-quick hover:ground-defined hover:ink checked:ground-accent checked:ink-inverse`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
        )
      })}
    </div>
  )
}
