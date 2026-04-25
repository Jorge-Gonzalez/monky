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
  contentDefault: string;
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

  /** Fix toolbar to the top of the editable element */
  fixedToolbar?: boolean;

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
  { name: 'bold', contentDefault: '<b>B</b>' },
  { name: 'italic', contentDefault: '<svg height="20" width="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1.28 1.28" xml:space="preserve"><path d="M.88.16H.56C.536.16.52.176.52.2s.016.04.04.04h.112l-.144.8H.4c-.024 0-.04.016-.04.04s.016.04.04.04h.32c.024 0 .04-.016.04-.04s-.016-.04-.04-.04H.608l.144-.8H.88C.904.24.92.224.92.2S.904.16.88.16"/></svg>' },
  { name: 'underline', contentDefault: '<svg height="20" width="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" xml:space="preserve"><path d="M5 27h22M24 5v10c0 4.4-3.6 8-8 8h0c-4.4 0-8-3.6-8-8V5" style="fill:none;stroke:#000;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10"/></svg>' },
  { name: 'anchor', contentDefault: '<svg height="20" width="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" xml:space="preserve"><path d="M27 17h-3c-.6 0-1 .4-1 1s.4 1 1 1h2c-.5 4.7-4.2 8.5-9 8.9V17h2c.6 0 1-.4 1-1s-.4-1-1-1h-2v-3.1c1.7-.4 3-2 3-3.9s-1.3-3.4-3-3.9V3c0-.6-.4-1-1-1s-1 .4-1 1v1.1c-1.7.4-3 2-3 3.9s1.3 3.4 3 3.9V15h-2c-.6 0-1 .4-1 1s.4 1 1 1h2v10.9c-4.7-.5-8.5-4.2-9-8.9h2c.6 0 1-.4 1-1s-.4-1-1-1H5c-.6 0-1 .4-1 1 0 6.6 5.4 12 12 12s12-5.4 12-12c0-.6-.4-1-1-1"/></svg>' },
  { name: 'unorderedlist', contentDefault: '<svg width="20" height="20" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="icon"><path d="M912 192H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8m0 284H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8m0 284H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8M104 228a56 56 0 1 0 112 0 56 56 0 1 0-112 0m0 284a56 56 0 1 0 112 0 56 56 0 1 0-112 0m0 284a56 56 0 1 0 112 0 56 56 0 1 0-112 0"/></svg>' },
  { name: 'orderedlist', contentDefault: '<svg width="20" height="20" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="icon"><path d="M920 760H336c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8m0-568H336c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8m0 284H336c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8M216 712H100c-2.2 0-4 1.8-4 4v34c0 2.2 1.8 4 4 4h72.4v20.5h-35.7c-2.2 0-4 1.8-4 4v34c0 2.2 1.8 4 4 4h35.7V838H100c-2.2 0-4 1.8-4 4v34c0 2.2 1.8 4 4 4h116c2.2 0 4-1.8 4-4V716c0-2.2-1.8-4-4-4M100 188h38v120c0 2.2 1.8 4 4 4h40c2.2 0 4-1.8 4-4V152c0-4.4-3.6-8-8-8h-78c-2.2 0-4 1.8-4 4v36c0 2.2 1.8 4 4 4m116 240H100c-2.2 0-4 1.8-4 4v36c0 2.2 1.8 4 4 4h68.4l-70.3 77.7a8.3 8.3 0 0 0-2.1 5.4V592c0 2.2 1.8 4 4 4h116c2.2 0 4-1.8 4-4v-36c0-2.2-1.8-4-4-4h-68.4l70.3-77.7a8.3 8.3 0 0 0 2.1-5.4V432c0-2.2-1.8-4-4-4"/></svg>' },
  { name: 'quote', contentDefault: '❝ Quote' }
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
  fixedToolbar = false,
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
            buttons: toolbarButtons,
            static: fixedToolbar,
            sticky: fixedToolbar
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
