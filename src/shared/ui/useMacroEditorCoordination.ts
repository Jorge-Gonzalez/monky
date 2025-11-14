/**
 * Coordination Hook for Macro Editor
 *
 * This hook encapsulates the coordination logic for macro editing:
 * - Form validation
 * - Rich text processing (HTML → plain text extraction)
 * - Content type detection
 * - State management
 *
 * This is a Layer 2 pattern - it coordinates Layer 1 primitives without
 * knowing about domain-specific storage or APIs.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Editor modes for state machine
 */
export type EditorMode =
  | 'idle'           // No interaction yet
  | 'editing'        // User is editing existing macro
  | 'creating'       // User is creating new macro
  | 'validating'     // Form is being validated
  | 'submitting';    // Form is being submitted

/**
 * Macro data structure (domain-agnostic)
 */
export interface MacroData {
  command: string;
  text: string;        // Plain text version
  html?: string;       // Rich HTML (only if has formatting)
  contentType: 'text/plain' | 'text/html';
  is_sensitive?: boolean;
}

/**
 * Validation errors
 */
export interface ValidationErrors {
  command?: string;
  content?: string;
}

/**
 * Coordination state
 */
export interface EditorCoordinationState {
  mode: EditorMode;
  command: string;
  htmlContent: string;
  plainText: string;
  isSensitive: boolean;
  errors: ValidationErrors;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Configuration for the coordination hook
 */
export interface EditorCoordinationConfig {
  /** Required command prefixes */
  prefixes: string[];

  /** Initial macro data (for editing) */
  initialData?: Partial<MacroData> & { id?: string | number };

  /** Validation callbacks */
  onValidate?: (data: MacroData) => ValidationErrors | null;

  /** Submit handler */
  onSubmit?: (data: MacroData, isEdit: boolean) => Promise<{ success: boolean; error?: string }>;

  /** Cancel handler */
  onCancel?: () => void;
}

/**
 * API exposed by the coordination hook
 */
export interface EditorCoordinationAPI {
  // State
  state: EditorCoordinationState;

  // Refs for child components
  editorRef: React.RefObject<any>;

  // Handlers
  handlers: {
    onCommandChange: (command: string) => void;
    onContentChange: (html: string) => void;
    onSensitiveChange: (isSensitive: boolean) => void;
    onSubmit: (e?: React.FormEvent) => Promise<void>;
    onCancel: () => void;
    onReset: () => void;
  };

  // Utilities
  hasRichFormatting: (html: string) => boolean;
  extractPlainText: (html: string) => string;
}

/**
 * Hook that coordinates macro editor components
 */
export function useMacroEditorCoordination({
  prefixes,
  initialData,
  onValidate,
  onSubmit,
  onCancel
}: EditorCoordinationConfig): EditorCoordinationAPI {

  // ============================================================================
  // STATE
  // ============================================================================

  const [state, setState] = useState<EditorCoordinationState>({
    mode: initialData ? 'editing' : 'creating',
    command: initialData?.command || '',
    htmlContent: initialData?.html || initialData?.text || '',
    plainText: initialData?.text || '',
    isSensitive: initialData?.is_sensitive || false,
    errors: {},
    isValid: false,
    isDirty: false
  });

  const editorRef = useRef<any>(null);

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Detect if HTML content has rich formatting
   */
  const hasRichFormatting = useCallback((html: string): boolean => {
    // Check for rich formatting elements
    const richElements = /<(?:strong|b|em|i|u|ul|ol|li|br|a\s|span\s)/i;
    const hasRichElements = richElements.test(html);

    // Check if content has line breaks that would need <br> tags
    const hasLineBreaks = html.includes('<br');

    return hasRichElements || hasLineBreaks;
  }, []);

  /**
   * Traverse DOM and extract plain text with semantic meaning for lists and line breaks
   */
  const traverse = useCallback((node: Node, text: string, listCounters: number[]): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Append text content, collapsing whitespace
      let textContent = node.textContent?.replace(/\s+/g, ' ') || '';

      // If we're inside a blockquote, add prefix to each line
      const blockquote = (node.parentElement as HTMLElement)?.closest('blockquote');
      if (blockquote) {
        textContent = textContent.split('\n').map(line =>
          line.trim() ? `> ${line}` : line
        ).join('\n');
      }

      text += textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const isBlock = ['div', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'].includes(tagName);
      const isList = ['ul', 'ol'].includes(tagName);
      const isListItem = tagName === 'li';

      // Handle line breaks for <br> tags
      if (tagName === 'br') {
        text += '\n';
        return text;
      }

      // Handle start of lists
      if (isList) {
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
        if (tagName === 'ol') {
          listCounters.push(1);
        }
      }

      // Handle blockquotes
      else if (tagName === 'blockquote') {
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
      }

      // Handle list items
      else if (isListItem) {
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
        const parentTag = element.parentElement?.tagName.toLowerCase();
        if (parentTag === 'ol') {
          const counter = listCounters[listCounters.length - 1]++;
          text += `${counter}. `;
        } else {
          text += '• ';
        }
      }

      // Handle other block elements
      else if (isBlock) {
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
      }

      // Process all child nodes
      for (const child of Array.from(element.childNodes)) {
        text = traverse(child, text, listCounters);
      }

      // Handle end of elements
      if (isList) {
        if (tagName === 'ol') {
          listCounters.pop();
        }
        if (!text.endsWith('\n')) {
          text += '\n';
        }
        if (!text.endsWith('\n\n')) {
          text += '\n';
        }
      } else if (tagName === 'blockquote') {
        if (!text.endsWith('\n')) {
          text += '\n';
        }
        if (!text.endsWith('\n\n')) {
          text += '\n';
        }
      } else if (isBlock && !isListItem) {
        if (!text.endsWith('\n')) {
          text += '\n';
        }
        if (tagName === 'p' && !text.endsWith('\n\n')) {
          text += '\n';
        }
      }
    }
    return text;
  }, []);

  /**
   * Extract plain text from HTML
   */
  const extractPlainText = useCallback((html: string): string => {
    const tempEl = document.createElement('div');
    tempEl.innerHTML = html;

    let text = '';
    const listCounters: number[] = [];

    text = traverse(tempEl, text, listCounters);

    // Clean up extra newlines and trim whitespace
    return text.replace(/\n{3,}/g, '\n\n').trim();
  }, [traverse]);

  /**
   * Validate command
   */
  const validateCommand = useCallback((cmd: string): string | null => {
    if (!cmd.trim()) return 'Command is required';
    if (!prefixes.some(prefix => cmd.startsWith(prefix))) {
      return `Command must start with one of: ${prefixes.join(', ')}`;
    }
    return null;
  }, [prefixes]);

  /**
   * Validate form and return errors
   */
  const validateForm = useCallback((command: string, htmlContent: string): ValidationErrors => {
    const errors: ValidationErrors = {};

    const commandError = validateCommand(command);
    if (commandError) {
      errors.command = commandError;
    }

    if (!htmlContent.trim()) {
      errors.content = 'Content is required';
    }

    return errors;
  }, [validateCommand]);

  // ============================================================================
  // COORDINATION RULES
  // ============================================================================

  /**
   * Rule: When command changes
   */
  const handleCommandChange = useCallback((command: string) => {
    setState(prev => {
      const errors = validateForm(command, prev.htmlContent);
      return {
        ...prev,
        command,
        errors,
        isValid: Object.keys(errors).length === 0,
        isDirty: true
      };
    });
  }, [validateForm]);

  /**
   * Rule: When content changes
   */
  const handleContentChange = useCallback((html: string) => {
    setState(prev => {
      const plainText = extractPlainText(html);
      const errors = validateForm(prev.command, html);

      return {
        ...prev,
        htmlContent: html,
        plainText,
        errors,
        isValid: Object.keys(errors).length === 0,
        isDirty: true
      };
    });
  }, [extractPlainText, validateForm]);

  /**
   * Rule: When sensitive flag changes
   */
  const handleSensitiveChange = useCallback((isSensitive: boolean) => {
    setState(prev => ({
      ...prev,
      isSensitive,
      isDirty: true
    }));
  }, []);

  /**
   * Rule: Form submission
   */
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setState(prev => ({ ...prev, mode: 'validating' }));

    // Validate
    const errors = validateForm(state.command, state.htmlContent);
    if (Object.keys(errors).length > 0) {
      setState(prev => ({ ...prev, errors, mode: prev.mode === 'editing' ? 'editing' : 'creating' }));
      return;
    }

    // Prepare macro data
    const hasRichContent = hasRichFormatting(state.htmlContent);
    const macroData: MacroData = {
      command: state.command,
      text: state.plainText,
      html: hasRichContent ? state.htmlContent : undefined,
      contentType: hasRichContent ? 'text/html' : 'text/plain',
      is_sensitive: state.isSensitive
    };

    // Additional validation
    if (onValidate) {
      const customErrors = onValidate(macroData);
      if (customErrors) {
        setState(prev => ({ ...prev, errors: customErrors, mode: prev.mode === 'editing' ? 'editing' : 'creating' }));
        return;
      }
    }

    // Submit
    if (onSubmit) {
      setState(prev => ({ ...prev, mode: 'submitting' }));
      const isEdit = !!initialData?.id;
      const result = await onSubmit(macroData, isEdit);

      if (result.success) {
        // Reset form if creating new
        if (!isEdit) {
          setState({
            mode: 'creating',
            command: '',
            htmlContent: '',
            plainText: '',
            isSensitive: false,
            errors: {},
            isValid: false,
            isDirty: false
          });
          editorRef.current?.clear();
        } else {
          setState(prev => ({ ...prev, mode: 'editing', isDirty: false }));
        }
      } else {
        setState(prev => ({
          ...prev,
          mode: prev.mode === 'editing' ? 'editing' : 'creating',
          errors: { content: result.error || 'Submission failed' }
        }));
      }
    }
  }, [state, validateForm, hasRichFormatting, onValidate, onSubmit, initialData]);

  /**
   * Rule: Cancel editing
   */
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  /**
   * Rule: Reset form
   */
  const handleReset = useCallback(() => {
    setState({
      mode: 'creating',
      command: '',
      htmlContent: '',
      plainText: '',
      isSensitive: false,
      errors: {},
      isValid: false,
      isDirty: false
    });
    editorRef.current?.clear();
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Validate initial data on mount (for edit mode)
   */
  useEffect(() => {
    if (initialData) {
      const errors = validateForm(state.command, state.htmlContent);
      setState(prev => ({
        ...prev,
        errors,
        isValid: Object.keys(errors).length === 0
      }));
    }
  }, []); // Only run on mount

  // ============================================================================
  // API
  // ============================================================================

  return {
    state,
    editorRef,
    handlers: {
      onCommandChange: handleCommandChange,
      onContentChange: handleContentChange,
      onSensitiveChange: handleSensitiveChange,
      onSubmit: handleSubmit,
      onCancel: handleCancel,
      onReset: handleReset
    },
    hasRichFormatting,
    extractPlainText
  };
}
