/**
 * RichTextEditor - Layer 1 Primitive Component
 *
 * Domain-agnostic rich text editor wrapper for Medium Editor.
 * Can be used for any rich text editing needs (macros, notes, comments, etc.)
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as MediumEditor from 'medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';

/**
 * Toolbar button configuration
 */
export interface EditorToolbarButton {
  name: string;
  contentFA: string;
}

/**
 * Props for RichTextEditor
 */
export interface RichTextEditorProps {
  /** Current HTML content */
  value?: string;

  /** Called when content changes */
  onChange?: (html: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Container ref for toolbar positioning (useful in modals) */
  containerRef?: React.RefObject<HTMLElement>;

  /** Toolbar buttons (defaults to standard formatting) */
  toolbarButtons?: EditorToolbarButton[];

  /** CSS class name */
  className?: string;

  /** Auto-focus on mount */
  autoFocus?: boolean;

  /** Paste configuration */
  pasteConfig?: {
    forcePlainText?: boolean;
    cleanPastedHTML?: boolean;
    cleanAttrs?: string[];
    cleanTags?: string[];
  };
}

/**
 * Ref API exposed by RichTextEditor
 */
export interface RichTextEditorRef {
  /** Get current HTML content */
  getHTML: () => string;

  /** Set HTML content */
  setHTML: (html: string) => void;

  /** Clear content */
  clear: () => void;

  /** Focus the editor */
  focus: () => void;

  /** Get the underlying Medium Editor instance */
  getEditor: () => any;
}

/**
 * Default toolbar buttons
 */
const DEFAULT_TOOLBAR_BUTTONS: EditorToolbarButton[] = [
  { name: 'bold', contentFA: '<b>B</b>' },
  { name: 'italic', contentFA: '<i>I</i>' },
  { name: 'underline', contentFA: '<u>U</u>' },
  { name: 'anchor', contentFA: '🔗' },
  { name: 'unorderedlist', contentFA: '• List' },
  { name: 'orderedlist', contentFA: '1. List' },
  { name: 'quote', contentFA: '❝ Quote' }
];

/**
 * RichTextEditor - Domain-agnostic rich text editing component
 *
 * Features:
 * - Medium Editor integration
 * - Customizable toolbar
 * - HTML content management
 * - Paste cleanup
 * - Modal-friendly (toolbar positioning)
 * - Ref API for programmatic control
 */
export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Enter text...',
  containerRef,
  toolbarButtons = DEFAULT_TOOLBAR_BUTTONS,
  className = '',
  autoFocus = false,
  pasteConfig = {
    forcePlainText: false,
    cleanPastedHTML: true,
    cleanAttrs: ['class', 'style', 'dir'],
    cleanTags: ['meta']
  }
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const mediumEditorRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  // ============================================================================
  // EXPOSED API (via ref)
  // ============================================================================

  useImperativeHandle(ref, () => ({
    getHTML: () => editorRef.current?.innerHTML || '',
    setHTML: (html: string) => {
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
      }
    },
    clear: () => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    },
    focus: () => {
      editorRef.current?.focus();
    },
    getEditor: () => mediumEditorRef.current
  }));

  // ============================================================================
  // MEDIUM EDITOR INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (editorRef.current && !mediumEditorRef.current) {
      try {
        mediumEditorRef.current = new MediumEditor.default(editorRef.current, {
          elementsContainer: containerRef?.current,
          toolbar: {
            relativeContainer: containerRef?.current,
            buttons: toolbarButtons
          },
          placeholder: {
            text: placeholder
          },
          paste: pasteConfig
        });

        // Listen for content changes
        mediumEditorRef.current.subscribe('editableInput', () => {
          if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
          }
        });

        // Auto-focus if requested
        if (autoFocus) {
          editorRef.current.focus();
        }
      } catch (error) {
        console.error('Failed to initialize Medium Editor:', error);
      }
    }

    return () => {
      if (mediumEditorRef.current) {
        try {
          mediumEditorRef.current.destroy();
        } catch (error) {
          console.error('Error destroying Medium Editor:', error);
        }
        mediumEditorRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // ============================================================================
  // VALUE SYNCHRONIZATION
  // ============================================================================

  useEffect(() => {
    // Skip initial mount to avoid overwriting user's initial content
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (editorRef.current && value) {
        editorRef.current.innerHTML = value;
      }
      return;
    }

    // Update editor content when value prop changes
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className={`rich-text-editor medium-editor-element ${className}`}
      style={{ outline: 'none' }}
      data-placeholder={placeholder}
    />
  );
});

RichTextEditor.displayName = 'RichTextEditor';
