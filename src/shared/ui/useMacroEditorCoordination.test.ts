/**
 * Tests for useMacroEditorCoordination hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/preact';
import { useMacroEditorCoordination } from './useMacroEditorCoordination';

describe('useMacroEditorCoordination', () => {
  const defaultConfig = {
    prefixes: ['/', '#', '@']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with idle mode when no initial data', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      expect(result.current.state.mode).toBe('creating');
      expect(result.current.state.command).toBe('');
      expect(result.current.state.htmlContent).toBe('');
      expect(result.current.state.plainText).toBe('');
      expect(result.current.state.isSensitive).toBe(false);
      expect(result.current.state.isDirty).toBe(false);
      expect(result.current.state.isValid).toBe(false);
    });

    it('should initialize with editing mode when initial data provided', () => {
      const initialData = {
        id: '1',
        command: '/test',
        text: 'Test content',
        html: '<p>Test content</p>',
        contentType: 'text/html' as const,
        is_sensitive: true
      };

      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, initialData })
      );

      expect(result.current.state.mode).toBe('editing');
      expect(result.current.state.command).toBe('/test');
      expect(result.current.state.htmlContent).toBe('<p>Test content</p>');
      expect(result.current.state.plainText).toBe('Test content');
      expect(result.current.state.isSensitive).toBe(true);
    });

    it('should use text as htmlContent when html is not provided', () => {
      const initialData = {
        command: '/test',
        text: 'Plain text content',
        contentType: 'text/plain' as const
      };

      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, initialData })
      );

      expect(result.current.state.htmlContent).toBe('Plain text content');
    });
  });

  describe('Command Validation', () => {
    it('should invalidate empty command', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onCommandChange('');
        result.current.handlers.onContentChange('Some content');
      });

      expect(result.current.state.isValid).toBe(false);
    });

    it('should invalidate command without valid prefix', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onCommandChange('test');
        result.current.handlers.onContentChange('Some content');
      });

      expect(result.current.state.isValid).toBe(false);
      expect(result.current.state.errors.command).toContain('must start with');
    });

    it('should validate command with / prefix', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Some content');
      });

      expect(result.current.state.isValid).toBe(true);
      expect(result.current.state.errors.command).toBeUndefined();
    });

    it('should validate command with # prefix', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onCommandChange('#test');
        result.current.handlers.onContentChange('Some content');
      });

      expect(result.current.state.isValid).toBe(true);
    });

    it('should validate command with @ prefix', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onCommandChange('@test');
        result.current.handlers.onContentChange('Some content');
      });

      expect(result.current.state.isValid).toBe(true);
    });

    it('should work with single prefix', () => {
      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, prefixes: ['/'] })
      );

      act(() => {
        result.current.handlers.onCommandChange('#test');
        result.current.handlers.onContentChange('Some content');
      });

      expect(result.current.state.isValid).toBe(false);
      expect(result.current.state.errors.command).toContain('must start with one of: /');
    });
  });

  describe('Content Validation', () => {
    it('should invalidate empty content', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('');
      });

      expect(result.current.state.isValid).toBe(false);
      expect(result.current.state.errors.content).toBe('Content is required');
    });

    it('should invalidate whitespace-only content', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('   ');
      });

      expect(result.current.state.isValid).toBe(false);
    });

    it('should validate non-empty content', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Some content');
      });

      expect(result.current.state.isValid).toBe(true);
      expect(result.current.state.errors.content).toBeUndefined();
    });
  });

  describe('Plain Text Extraction', () => {
    it('should extract plain text from simple HTML', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onContentChange('<p>Hello World</p>');
      });

      expect(result.current.state.plainText).toBe('Hello World');
    });

    it('should handle line breaks', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onContentChange('<p>Line 1</p><p>Line 2</p>');
      });

      expect(result.current.state.plainText).toContain('Line 1');
      expect(result.current.state.plainText).toContain('Line 2');
    });

    it('should extract text from unordered lists', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onContentChange('<ul><li>Item 1</li><li>Item 2</li></ul>');
      });

      expect(result.current.state.plainText).toContain('• Item 1');
      expect(result.current.state.plainText).toContain('• Item 2');
    });

    it('should extract text from ordered lists', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onContentChange('<ol><li>First</li><li>Second</li></ol>');
      });

      expect(result.current.state.plainText).toContain('1. First');
      expect(result.current.state.plainText).toContain('2. Second');
    });

    it('should handle blockquotes', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onContentChange('<blockquote>Quoted text</blockquote>');
      });

      expect(result.current.state.plainText).toContain('> Quoted text');
    });

    it('should handle nested lists', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onContentChange(
          '<ol><li>First<ol><li>Nested</li></ol></li></ol>'
        );
      });

      expect(result.current.state.plainText).toContain('1. First');
      expect(result.current.state.plainText).toContain('1. Nested');
    });
  });

  describe('Rich Formatting Detection', () => {
    it('should detect bold as rich formatting', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      const hasRich = result.current.hasRichFormatting('<strong>Bold</strong>');
      expect(hasRich).toBe(true);
    });

    it('should detect italic as rich formatting', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      const hasRich = result.current.hasRichFormatting('<em>Italic</em>');
      expect(hasRich).toBe(true);
    });

    it('should detect links as rich formatting', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      const hasRich = result.current.hasRichFormatting('<a href="#">Link</a>');
      expect(hasRich).toBe(true);
    });

    it('should detect line breaks as rich formatting', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      const hasRich = result.current.hasRichFormatting('Line 1<br>Line 2');
      expect(hasRich).toBe(true);
    });

    it('should not detect plain text as rich formatting', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      const hasRich = result.current.hasRichFormatting('Plain text');
      expect(hasRich).toBe(false);
    });

    it('should not detect simple paragraphs as rich formatting', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      const hasRich = result.current.hasRichFormatting('<p>Just text</p>');
      expect(hasRich).toBe(false);
    });
  });

  describe('Dirty State', () => {
    it('should mark as dirty when command changes', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      expect(result.current.state.isDirty).toBe(false);

      act(() => {
        result.current.handlers.onCommandChange('/test');
      });

      expect(result.current.state.isDirty).toBe(true);
    });

    it('should mark as dirty when content changes', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onContentChange('New content');
      });

      expect(result.current.state.isDirty).toBe(true);
    });

    it('should mark as dirty when sensitive flag changes', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onSensitiveChange(true);
      });

      expect(result.current.state.isDirty).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should not submit invalid form', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onSubmit })
      );

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.state.errors.command).toBeTruthy();
      expect(result.current.state.errors.content).toBeTruthy();
    });

    it('should submit valid form', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onSubmit })
      );

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Test content');
      });

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          command: '/test',
          text: 'Test content',
          contentType: 'text/plain'
        }),
        false // isEdit
      );
    });

    it('should include HTML when content has rich formatting', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onSubmit })
      );

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('<strong>Bold</strong> text');
      });

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<strong>Bold</strong> text',
          contentType: 'text/html'
        }),
        false
      );
    });

    it('should not include HTML when content is plain text', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onSubmit })
      );

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Plain text');
      });

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          html: undefined,
          contentType: 'text/plain'
        }),
        false
      );
    });

    it('should include sensitive flag', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onSubmit })
      );

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Content');
        result.current.handlers.onSensitiveChange(true);
      });

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          is_sensitive: true
        }),
        false
      );
    });

    it('should pass isEdit=true when editing existing macro', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const initialData = {
        id: '1',
        command: '/test',
        text: 'Test',
        contentType: 'text/plain' as const
      };

      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, initialData, onSubmit })
      );

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(expect.any(Object), true); // isEdit
    });

    it('should reset form after successful creation', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onSubmit })
      );

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Content');
      });

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      await waitFor(() => {
        expect(result.current.state.command).toBe('');
        expect(result.current.state.htmlContent).toBe('');
        expect(result.current.state.isDirty).toBe(false);
      });
    });

    it('should not reset form after successful edit', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const initialData = {
        id: '1',
        command: '/test',
        text: 'Test',
        contentType: 'text/plain' as const
      };

      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, initialData, onSubmit })
      );

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      await waitFor(() => {
        expect(result.current.state.command).toBe('/test');
        expect(result.current.state.mode).toBe('editing');
      });
    });

    it('should show error when submission fails', async () => {
      const onSubmit = vi.fn().mockResolvedValue({
        success: false,
        error: 'Save failed'
      });

      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onSubmit })
      );

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Content');
      });

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      await waitFor(() => {
        expect(result.current.state.errors.content).toBe('Save failed');
      });
    });

    it('should call custom validation', async () => {
      const onValidate = vi.fn().mockReturnValue({
        command: 'Custom error'
      });
      const onSubmit = vi.fn();

      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onValidate, onSubmit })
      );

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Content');
      });

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      expect(onValidate).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.state.errors.command).toBe('Custom error');
    });
  });

  describe('Cancel and Reset', () => {
    it('should call onCancel handler', () => {
      const onCancel = vi.fn();
      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onCancel })
      );

      act(() => {
        result.current.handlers.onCancel();
      });

      expect(onCancel).toHaveBeenCalled();
    });

    it('should reset form state', () => {
      const { result } = renderHook(() => useMacroEditorCoordination(defaultConfig));

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Content');
        result.current.handlers.onSensitiveChange(true);
      });

      act(() => {
        result.current.handlers.onReset();
      });

      expect(result.current.state.command).toBe('');
      expect(result.current.state.htmlContent).toBe('');
      expect(result.current.state.isSensitive).toBe(false);
      expect(result.current.state.isDirty).toBe(false);
      expect(result.current.state.mode).toBe('creating');
    });
  });

  describe('Mode Transitions', () => {
    it('should eventually return to creating mode after successful submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, onSubmit })
      );

      act(() => {
        result.current.handlers.onCommandChange('/test');
        result.current.handlers.onContentChange('Content');
      });

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      // After successful submission, mode should be back to creating
      expect(result.current.state.mode).toBe('creating');
    });

    it('should return to editing mode after successful edit', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const initialData = {
        id: '1',
        command: '/test',
        text: 'Test',
        contentType: 'text/plain' as const
      };

      const { result } = renderHook(() =>
        useMacroEditorCoordination({ ...defaultConfig, initialData, onSubmit })
      );

      await act(async () => {
        await result.current.handlers.onSubmit();
      });

      // After successful edit, mode should be back to editing
      expect(result.current.state.mode).toBe('editing');
    });
  });
});
