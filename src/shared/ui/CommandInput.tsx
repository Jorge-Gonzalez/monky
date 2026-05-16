/**
 * CommandInput - Layer 1 Primitive Component
 *
 * Domain-agnostic input field with prefix validation.
 * Can be used for any command-style inputs (macros, shortcuts, CLI commands, etc.)
 */

import React, { useCallback, useEffect, useRef } from 'react';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Props for CommandInput
 */
export interface CommandInputProps {
  /** Current value */
  value: string;

  /** Called when value changes */
  onChange: (value: string) => void;

  /** Required prefixes (e.g., ['/', '#', '@']) */
  prefixes: string[];

  /** Placeholder text */
  placeholder?: string;

  /** Maximum length */
  maxLength?: number;

  /** Label text */
  label?: string;

  /** Show validation error inline */
  showValidation?: boolean;

  /** Custom validation function (in addition to prefix check) */
  customValidation?: (value: string) => ValidationResult;

  /** CSS class name */
  className?: string;

  /** Auto-focus on mount */
  autoFocus?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Called when Enter is pressed */
  onEnter?: () => void;

  /** Called on blur */
  onBlur?: () => void;
}

/**
 * CommandInput - Validated prefix-based input field
 *
 * Features:
 * - Prefix validation (must start with one of the provided prefixes)
 * - Visual error states
 * - Custom validation support
 * - Keyboard support (Enter handler)
 * - Accessible (labels, ARIA)
 */
export function CommandInput({
  value,
  onChange,
  prefixes,
  placeholder = 'Enter command...',
  maxLength = 50,
  label,
  showValidation = true,
  customValidation,
  className = '',
  autoFocus = false,
  disabled = false,
  onEnter,
  onBlur
}: CommandInputProps) {

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validate = useCallback((val: string): ValidationResult => {
    // Empty is considered invalid (but no error message shown until user types)
    if (!val.trim()) {
      return { isValid: false };
    }

    // Check prefix
    const hasValidPrefix = prefixes.some(prefix => val.startsWith(prefix));
    if (!hasValidPrefix) {
      return {
        isValid: false,
        error: `Command must start with: ${prefixes.join(', ')}`
      };
    }

    // Custom validation (if provided)
    if (customValidation) {
      return customValidation(val);
    }

    return { isValid: true };
  }, [prefixes, customValidation]);

  const validationResult = validate(value);
  const showError = showValidation && value.trim() !== '' && !validationResult.isValid;

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter();
    }
  }, [onEnter]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`command-input-container ${className}`}>
      {label && (
        <label htmlFor="command-input" className="command-input-label">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        id="command-input"
        type="text"
        className={`command-input ${showError ? 'command-input-error' : ''}`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={showError}
        aria-describedby={showError ? 'command-input-error' : undefined}
      />

      {showError && validationResult.error && (
        <p id="command-input-error" className="command-input-error-message" role="alert">
          {validationResult.error}
        </p>
      )}

      {!showError && prefixes.length > 0 && value === '' && (
        <p className="command-input-hint">
          Example: {placeholder || `${prefixes[0]}example`}
        </p>
      )}
    </div>
  );
}
