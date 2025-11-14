/**
 * ToggleField - Layer 1 Primitive Component
 *
 * Domain-agnostic checkbox/toggle with label and description.
 * Can be used for any boolean options (settings, preferences, flags, etc.)
 */

import React, { useCallback } from 'react';

/**
 * Props for ToggleField
 */
export interface ToggleFieldProps {
  /** Current checked state */
  checked: boolean;

  /** Called when checked state changes */
  onChange: (checked: boolean) => void;

  /** Label text */
  label: string;

  /** Optional description/help text */
  description?: string;

  /** CSS class name */
  className?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Name attribute for form submission */
  name?: string;

  /** ID for the input (auto-generated if not provided) */
  id?: string;
}

/**
 * ToggleField - Generic checkbox/toggle with label
 *
 * Features:
 * - Checkbox input with label
 * - Optional description text
 * - Accessible (proper label association, ARIA)
 * - Keyboard support (Space to toggle)
 */
export function ToggleField({
  checked,
  onChange,
  label,
  description,
  className = '',
  disabled = false,
  name,
  id
}: ToggleFieldProps) {

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  }, [onChange]);

  // Generate ID if not provided
  const inputId = id || `toggle-${name || label.toLowerCase().replace(/\s+/g, '-')}`;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`toggle-field ${className}`}>
      <label htmlFor={inputId} className="toggle-field-label">
        <input
          id={inputId}
          type="checkbox"
          className="toggle-field-input"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          name={name}
          aria-describedby={description ? `${inputId}-description` : undefined}
        />
        <span className="toggle-field-text">{label}</span>
      </label>

      {description && (
        <p id={`${inputId}-description`} className="toggle-field-description">
          {description}
        </p>
      )}
    </div>
  );
}
