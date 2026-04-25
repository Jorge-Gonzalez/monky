/**
 * MacroEditorView - Layer 2 Coordinator Component
 *
 * This component demonstrates the 3-layer architecture pattern:
 * - Layer 1: Primitives (RichTextEditor, CommandInput, ToggleField)
 * - Layer 2: THIS - Coordinator that expresses component interactions
 * - Layer 3: Domain-specific usage (MacroForm, etc.)
 *
 * The coordination logic lives in useMacroEditorCoordination hook, making this
 * component a thin, declarative presentation of how components work together.
 */

import React from 'react';
import { RichTextEditor, RichTextEditorRef } from './RichTextEditor';
import { CommandInput } from './CommandInput';
import { ToggleField } from './ToggleField';
import { useMacroEditorCoordination, MacroData } from './useMacroEditorCoordination';

/**
 * Configuration for MacroEditorView behavior
 */
export interface MacroEditorConfig {
  /** Command input configuration */
  command?: {
    label?: string;
    placeholder?: string;
    maxLength?: number;
  };

  /** Rich text editor configuration */
  editor?: {
    placeholder?: string;
    label?: string;
    containerRef?: React.RefObject<HTMLElement>;
    fixedToolbar?: boolean;
  };

  /** Sensitive toggle configuration */
  sensitive?: {
    label?: string;
    description?: string;
    showByDefault?: boolean;
  };

  /** Submit button configuration */
  submit?: {
    createLabel?: string;
    updateLabel?: string;
    showCancel?: boolean;
    cancelLabel?: string;
  };
}

/**
 * Props for MacroEditorView component
 */
export interface MacroEditorViewProps {
  /** Required command prefixes */
  prefixes: string[];

  /** Initial macro data (for editing) */
  initialData?: Partial<MacroData> & { id?: string | number };

  /** Configuration object */
  config?: MacroEditorConfig;

  /** CSS class name for the container */
  className?: string;

  // Events
  /** Custom validation */
  onValidate?: (data: MacroData) => { command?: string; content?: string } | null;

  /** Called when form is submitted */
  onSubmit?: (data: MacroData, isEdit: boolean) => Promise<{ success: boolean; error?: string }>;

  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * MacroEditorView - Thin coordinator component
 *
 * This component demonstrates good Layer 2 design:
 * - Minimal state (all in coordination hook)
 * - Clear component composition
 * - Explicit data flow through coordination API
 */
export function MacroEditorView({
  prefixes,
  initialData,
  config = {},
  className = '',
  onValidate,
  onSubmit,
  onCancel
}: MacroEditorViewProps) {

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  const {
    label: commandLabel = 'Command',
    placeholder: commandPlaceholder,
    maxLength: commandMaxLength = 50
  } = config.command || {};

  const {
    placeholder: editorPlaceholder = 'Enter your macro content...',
    label: editorLabel = 'Content',
    containerRef: editorContainerRef,
    fixedToolbar: editorFixedToolbar = false
  } = config.editor || {};

  const {
    label: sensitiveLabel = 'Encrypt this macro',
    description: sensitiveDescription = 'Sensitive macros are encrypted in storage',
    showByDefault: showSensitiveByDefault = true
  } = config.sensitive || {};

  const {
    createLabel = 'Save',
    updateLabel = 'Update',
    showCancel = !!initialData,
    cancelLabel = 'Cancel'
  } = config.submit || {};

  // ============================================================================
  // COORDINATION HOOK
  // All complex state management and interaction logic lives here
  // ============================================================================

  const coordination = useMacroEditorCoordination({
    prefixes,
    initialData,
    onValidate,
    onSubmit,
    onCancel
  });

  const { state, editorRef, handlers } = coordination;

  const isEditing = state.mode === 'editing';
  const isSubmitting = state.mode === 'submitting';

  // ============================================================================
  // RENDER - Pure presentation, no logic
  // ============================================================================

  return (
    <form
      onSubmit={handlers.onSubmit}
      className={`macro-editor-view ${className}`}
    >
      {/* Command Input */}
      <CommandInput
        value={state.command}
        onChange={handlers.onCommandChange}
        prefixes={prefixes}
        label={commandLabel}
        placeholder={commandPlaceholder || `e.g., ${prefixes[0]}example`}
        maxLength={commandMaxLength}
        showValidation={state.isDirty}
        disabled={isSubmitting}
      />

      {/* Rich Text Editor */}
      <div className="macro-editor-content">
        {editorLabel && (
          <label className="macro-editor-label">
            {editorLabel}
          </label>
        )}

        <RichTextEditor
          ref={editorRef as React.Ref<RichTextEditorRef>}
          value={state.htmlContent}
          onChange={handlers.onContentChange}
          placeholder={editorPlaceholder}
          containerRef={editorContainerRef}
          fixedToolbar={editorFixedToolbar}
        />

        {state.errors.content && (
          <p className="macro-editor-error" role="alert">
            {state.errors.content}
          </p>
        )}
      </div>

      {/* Sensitive Toggle */}
      {showSensitiveByDefault && (
        <ToggleField
          checked={state.isSensitive}
          onChange={handlers.onSensitiveChange}
          label={sensitiveLabel}
          description={sensitiveDescription}
          disabled={isSubmitting}
        />
      )}

      {/* Submit Buttons */}
      <div className="macro-editor-actions">
        <button
          type="submit"
          disabled={!state.isValid || isSubmitting}
          className="macro-editor-submit"
        >
          {isSubmitting ? 'Saving...' : (isEditing ? updateLabel : createLabel)}
        </button>

        {showCancel && onCancel && (
          <button
            type="button"
            onClick={handlers.onCancel}
            disabled={isSubmitting}
            className="macro-editor-cancel"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </form>
  );
}
