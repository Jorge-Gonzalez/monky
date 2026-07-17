import { useState } from 'react';

/**
 * Toggle an option in/out of the selection, refusing to drop below `minSelected`.
 * Returns the next selection, or null if the change was rejected.
 */
export function toggleSelection(
  selected: string[],
  option: string,
  minSelected: number,
): string[] | null {
  const isSelected = selected.includes(option);
  if (isSelected && selected.length <= minSelected) return null;
  return isSelected ? selected.filter(o => o !== option) : [...selected, option];
}

interface SelectableGroupProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Minimum that must stay selected. Default 1. */
  minSelected?: number;
  /** Extra classes on the group wrapper (layout). */
  className?: string;
  /** Base classes for each toggle button. */
  buttonClassName?: string;
}

/**
 * SelectableGroup — a row of toggle buttons that always keeps at least
 * `minSelected` selected; a rejected removal shakes the button. Pairs with the
 * `sf-selectable-group` / `sf-min-selected-1` semantic fragments and the
 * `sf-shake-suppression` effect-composition fragment.
 */
export function SelectableGroup({
  options,
  selected,
  onChange,
  minSelected = 1,
  className,
  buttonClassName,
}: SelectableGroupProps) {
  const [shake, setShake] = useState<string | null>(null);

  const handleClick = (option: string) => {
    const next = toggleSelection(selected, option, minSelected);
    if (!next) {
      setShake(option);
      setTimeout(() => setShake(null), 400);
      return;
    }
    onChange(next);
  };

  const minClass = minSelected === 1 ? 'sf-min-selected-1' : '';

  return (
    <div className={`sf-selectable-group ${minClass} ${className ?? ''}`} role="group">
      {options.map(option => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            role="switch"
            aria-checked={isSelected}
            onClick={() => handleClick(option)}
            className={`${buttonClassName ?? ''} tween-quick position-relative pressable selectable hover:ground-defined checked:ground-accent checked:ink-inverse checked:rule-accent ${isSelected ? 'is-selected hover:alpha-90' : ''} ${shake === option ? 'shake sf-shake-suppression' : ''}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
