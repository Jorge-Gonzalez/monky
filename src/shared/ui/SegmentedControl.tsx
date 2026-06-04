import { useLayoutEffect, useRef } from 'react'

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedIndex = options.findIndex(o => o.value === value)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const btn = container.querySelectorAll<HTMLElement>('.seg-option')[selectedIndex]
    if (!btn) return
    container.style.setProperty('--pill-left', `${btn.offsetLeft}px`)
    container.style.setProperty('--pill-width', `${btn.offsetWidth}px`)
  }, [selectedIndex])

  return (
    <div ref={containerRef} className="seg-control" role="radiogroup">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          className={`seg-option ${opt.value === value ? 'is-selected' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
