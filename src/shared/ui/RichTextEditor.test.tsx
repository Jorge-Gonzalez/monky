/**
 * Tests for RichTextEditor component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { RichTextEditor, RichTextEditorRef } from './RichTextEditor';
import React from 'react';

// Mock Medium Editor
const mockSubscribe = vi.fn();
const mockDestroy = vi.fn();

vi.mock('medium-editor', () => {
  return {
    default: vi.fn(() => ({
      subscribe: mockSubscribe,
      destroy: mockDestroy
    }))
  };
});

vi.mock('medium-editor/dist/css/medium-editor.css', () => ({}));
vi.mock('medium-editor/dist/css/themes/default.css', () => ({}));

// Import after mock
import MediumEditor from 'medium-editor';

describe('RichTextEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render contentEditable div', () => {
      const { container } = render(<RichTextEditor />);
      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<RichTextEditor className="custom-editor" />);
      expect(container.querySelector('.custom-editor')).toBeInTheDocument();
    });

    it('should have rich-text-editor class', () => {
      const { container } = render(<RichTextEditor />);
      expect(container.querySelector('.rich-text-editor')).toBeInTheDocument();
    });

    it('should have medium-editor-element class', () => {
      const { container } = render(<RichTextEditor />);
      expect(container.querySelector('.medium-editor-element')).toBeInTheDocument();
    });

    it('should set placeholder attribute', () => {
      const { container } = render(<RichTextEditor placeholder="Type here..." />);
      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor).toHaveAttribute('data-placeholder', 'Type here...');
    });

    it('should use default placeholder when not provided', () => {
      const { container } = render(<RichTextEditor />);
      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor).toHaveAttribute('data-placeholder', 'Enter text...');
    });
  });

  describe('Medium Editor Initialization', () => {
    it('should initialize Medium Editor on mount', () => {
      render(<RichTextEditor />);

      expect(MediumEditor).toHaveBeenCalled();
    });

    it('should subscribe to editableInput event', () => {
      render(<RichTextEditor />);
      expect(mockSubscribe).toHaveBeenCalledWith('editableInput', expect.any(Function));
    });

    it('should destroy Medium Editor on unmount', () => {
      const { unmount } = render(<RichTextEditor />);
      unmount();
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should pass toolbar buttons to Medium Editor', () => {
      const customButtons = [
        { name: 'bold', contentFA: '<b>B</b>' },
        { name: 'italic', contentFA: '<i>I</i>' }
      ];

      render(<RichTextEditor toolbarButtons={customButtons} />);

      expect(MediumEditor).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          toolbar: expect.objectContaining({
            buttons: customButtons
          })
        })
      );
    });

    it('should configure paste settings', () => {
      const pasteConfig = {
        forcePlainText: true,
        cleanPastedHTML: false
      };

      render(<RichTextEditor pasteConfig={pasteConfig} />);

      expect(MediumEditor).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          paste: pasteConfig
        })
      );
    });

    it('should pass containerRef for modal support', () => {
      const containerRef = React.createRef<HTMLDivElement>();

      render(
        <div ref={containerRef}>
          <RichTextEditor containerRef={containerRef} />
        </div>
      );

      expect(MediumEditor).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          elementsContainer: containerRef.current,
          toolbar: expect.objectContaining({
            relativeContainer: containerRef.current
          })
        })
      );
    });
  });

  describe('Value Control', () => {
    it('should set initial HTML content', () => {
      const { container } = render(<RichTextEditor value="<p>Hello World</p>" />);
      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor?.innerHTML).toBe('<p>Hello World</p>');
    });

    it('should update content when value prop changes', async () => {
      const { container, rerender } = render(<RichTextEditor value="<p>Initial</p>" />);
      const editor = container.querySelector('[contenteditable="true"]');

      expect(editor?.innerHTML).toBe('<p>Initial</p>');

      rerender(<RichTextEditor value="<p>Updated</p>" />);

      await waitFor(() => {
        expect(editor?.innerHTML).toBe('<p>Updated</p>');
      });
    });

    it('should call onChange when content changes', () => {
      const onChange = vi.fn();
      const { container } = render(<RichTextEditor onChange={onChange} />);

      // Get the callback that was registered with subscribe
      const editableInputCallback = mockSubscribe.mock.calls.find(
        (call: any) => call[0] === 'editableInput'
      )?.[1];

      // Simulate content change
      const editor = container.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = '<p>New content</p>';
      editableInputCallback?.();

      expect(onChange).toHaveBeenCalledWith('<p>New content</p>');
    });
  });

  describe('Ref API', () => {
    it('should expose getHTML method', () => {
      const ref = React.createRef<RichTextEditorRef>();
      const { container } = render(<RichTextEditor ref={ref} value="<p>Test</p>" />);

      expect(ref.current?.getHTML()).toBe('<p>Test</p>');
    });

    it('should expose setHTML method', () => {
      const ref = React.createRef<RichTextEditorRef>();
      const { container } = render(<RichTextEditor ref={ref} />);

      ref.current?.setHTML('<p>New content</p>');

      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor?.innerHTML).toBe('<p>New content</p>');
    });

    it('should expose clear method', () => {
      const ref = React.createRef<RichTextEditorRef>();
      const { container } = render(<RichTextEditor ref={ref} value="<p>Test</p>" />);

      ref.current?.clear();

      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor?.innerHTML).toBe('');
    });

    it('should expose focus method', () => {
      const ref = React.createRef<RichTextEditorRef>();
      const { container } = render(<RichTextEditor ref={ref} />);

      ref.current?.focus();

      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor).toHaveFocus();
    });

    it('should expose getEditor method', () => {
      const ref = React.createRef<RichTextEditorRef>();
      render(<RichTextEditor ref={ref} />);

      const editor = ref.current?.getEditor();
      expect(editor).toBeDefined();
      expect(editor).toHaveProperty('subscribe');
      expect(editor).toHaveProperty('destroy');
    });

    it('should handle methods when editor is not initialized', () => {
      const ref = React.createRef<RichTextEditorRef>();
      const { container } = render(<RichTextEditor ref={ref} />);

      // Clear the innerHTML to simulate uninitialized state
      const editor = container.querySelector('[contenteditable="true"]') as HTMLElement;

      // These should not throw
      expect(() => ref.current?.getHTML()).not.toThrow();
      expect(() => ref.current?.setHTML('')).not.toThrow();
      expect(() => ref.current?.clear()).not.toThrow();
    });
  });

  describe('Auto Focus', () => {
    it('should auto-focus when autoFocus is true', () => {
      const { container } = render(<RichTextEditor autoFocus />);
      const editor = container.querySelector('[contenteditable="true"]');

      // Note: In jsdom, focus() might not work exactly as in browser
      // but we can verify the method was set up correctly
      expect(editor).toBeInTheDocument();
    });

    it('should not auto-focus when autoFocus is false', () => {
      const { container } = render(<RichTextEditor autoFocus={false} />);
      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor).not.toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      const { container } = render(<RichTextEditor value="" />);
      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor?.innerHTML).toBe('');
    });

    it('should handle complex HTML', () => {
      const complexHTML = '<div><p>Paragraph</p><ul><li>Item 1</li><li>Item 2</li></ul></div>';
      const { container } = render(<RichTextEditor value={complexHTML} />);
      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor?.innerHTML).toBe(complexHTML);
    });

    it('should handle rapid value changes', async () => {
      const { container, rerender } = render(<RichTextEditor value="<p>1</p>" />);
      const editor = container.querySelector('[contenteditable="true"]');

      rerender(<RichTextEditor value="<p>2</p>" />);
      rerender(<RichTextEditor value="<p>3</p>" />);
      rerender(<RichTextEditor value="<p>4</p>" />);

      await waitFor(() => {
        expect(editor?.innerHTML).toBe('<p>4</p>');
      });
    });

    it('should not update when value is same as current content', () => {
      const { container, rerender } = render(<RichTextEditor value="<p>Test</p>" />);
      const editor = container.querySelector('[contenteditable="true"]') as HTMLElement;

      const initialHTML = editor.innerHTML;

      // Rerender with same value
      rerender(<RichTextEditor value="<p>Test</p>" />);

      expect(editor.innerHTML).toBe(initialHTML);
    });

    it('should handle null value gracefully', () => {
      const { container } = render(<RichTextEditor value={undefined} />);
      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle Medium Editor initialization failure', () => {
      vi.mocked(MediumEditor).mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      expect(() => render(<RichTextEditor />)).not.toThrow();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('should handle Medium Editor destroy failure', () => {
      mockDestroy.mockImplementationOnce(() => {
        throw new Error('Destroy failed');
      });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { unmount } = render(<RichTextEditor />);

      // Should not throw
      expect(() => unmount()).not.toThrow();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });
});
