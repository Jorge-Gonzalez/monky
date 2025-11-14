/**
 * Tests for MacroEditorView component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MacroEditorView } from './MacroEditorView';

// Mock Medium Editor
const mockSubscribe = vi.fn();
const mockDestroy = vi.fn();

vi.mock('medium-editor', () => ({
  default: vi.fn().mockImplementation(() => ({
    subscribe: mockSubscribe,
    destroy: mockDestroy
  }))
}));

vi.mock('medium-editor/dist/css/medium-editor.css', () => ({}));
vi.mock('medium-editor/dist/css/themes/default.css', () => ({}));

describe('MacroEditorView', () => {
  const defaultProps = {
    prefixes: ['/', '#', '@']
  };

  // Helper to simulate content editor input
  const setEditorContent = (container: HTMLElement, content: string) => {
    const editor = container.querySelector('[contenteditable="true"]') as HTMLElement;
    editor.innerHTML = content;

    // Trigger the subscriber that Medium Editor would call
    const subscriberCall = mockSubscribe.mock.calls.find(call => call[0] === 'editableInput');
    if (subscriberCall && subscriberCall[1]) {
      subscriberCall[1](); // Call the subscriber callback
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render command input', () => {
      render(<MacroEditorView {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render rich text editor', () => {
      const { container } = render(<MacroEditorView {...defaultProps} />);
      expect(container.querySelector('[contenteditable="true"]')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<MacroEditorView {...defaultProps} />);
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should render as a form', () => {
      const { container } = render(<MacroEditorView {...defaultProps} />);
      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<MacroEditorView {...defaultProps} className="custom-form" />);
      expect(container.querySelector('.custom-form')).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should use custom command label', () => {
      render(
        <MacroEditorView
          {...defaultProps}
          config={{ command: { label: 'Trigger' } }}
        />
      );

      expect(screen.getByText('Trigger')).toBeInTheDocument();
    });

    it('should use custom command placeholder', () => {
      render(
        <MacroEditorView
          {...defaultProps}
          config={{ command: { placeholder: 'Enter trigger...' } }}
        />
      );

      expect(screen.getByPlaceholderText('Enter trigger...')).toBeInTheDocument();
    });

    it('should use custom editor label', () => {
      render(
        <MacroEditorView
          {...defaultProps}
          config={{ editor: { label: 'Macro Text' } }}
        />
      );

      expect(screen.getByText('Macro Text')).toBeInTheDocument();
    });

    it('should use custom submit button labels', () => {
      render(
        <MacroEditorView
          {...defaultProps}
          config={{ submit: { createLabel: 'Create New' } }}
        />
      );

      expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
    });

    it('should show update button when editing', () => {
      const initialData = {
        id: '1',
        command: '/test',
        text: 'Test',
        contentType: 'text/plain' as const
      };

      render(
        <MacroEditorView
          {...defaultProps}
          initialData={initialData}
          config={{ submit: { updateLabel: 'Update Macro' } }}
        />
      );

      expect(screen.getByRole('button', { name: 'Update Macro' })).toBeInTheDocument();
    });

    it('should render cancel button when editing', () => {
      const initialData = {
        id: '1',
        command: '/test',
        text: 'Test',
        contentType: 'text/plain' as const
      };

      render(<MacroEditorView {...defaultProps} initialData={initialData} onCancel={vi.fn()} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render cancel button when creating', () => {
      render(<MacroEditorView {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('should force show cancel button with config', () => {
      render(
        <MacroEditorView
          {...defaultProps}
          onCancel={vi.fn()}
          config={{ submit: { showCancel: true } }}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should customize sensitive toggle label', () => {
      render(
        <MacroEditorView
          {...defaultProps}
          config={{ sensitive: { label: 'Private macro' } }}
        />
      );

      expect(screen.getByText('Private macro')).toBeInTheDocument();
    });

    it('should hide sensitive toggle with config', () => {
      render(
        <MacroEditorView
          {...defaultProps}
          config={{ sensitive: { showByDefault: false } }}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  describe('Initial Data', () => {
    it('should populate fields with initial data', () => {
      const initialData = {
        id: '1',
        command: '/greeting',
        text: 'Hello World',
        html: '<strong>Hello World</strong>',
        contentType: 'text/html' as const,
        is_sensitive: true
      };

      render(<MacroEditorView {...defaultProps} initialData={initialData} />);

      const commandInput = screen.getByRole('textbox') as HTMLInputElement;
      expect(commandInput.value).toBe('/greeting');

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should use text when html is not available', () => {
      const initialData = {
        command: '/test',
        text: 'Plain text',
        contentType: 'text/plain' as const
      };

      const { container } = render(<MacroEditorView {...defaultProps} initialData={initialData} />);

      const editor = container.querySelector('[contenteditable="true"]');
      expect(editor?.innerHTML).toBe('Plain text');
    });
  });

  describe('Form Interaction', () => {
    it('should update command when typed', () => {
      render(<MacroEditorView {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '/test' } });

      expect((input as HTMLInputElement).value).toBe('/test');
    });

    it('should toggle sensitive checkbox', () => {
      render(<MacroEditorView {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('should disable submit button when form is invalid', () => {
      render(<MacroEditorView {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is valid', async () => {
      const { container } = render(<MacroEditorView {...defaultProps} />);

      // Enter command
      const commandInput = screen.getByRole('textbox');
      fireEvent.change(commandInput, { target: { value: '/test' } });

      // Enter content in editor
      setEditorContent(container, 'Test content');

      const submitButton = screen.getByRole('button', { name: /save/i });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with macro data', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const { container } = render(<MacroEditorView {...defaultProps} onSubmit={onSubmit} />);

      // Fill form
      const commandInput = screen.getByRole('textbox');
      fireEvent.change(commandInput, { target: { value: '/test' } });

      setEditorContent(container, 'Test content');

      // Submit
      const form = container.querySelector('form')!;

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save/i });
        expect(submitButton).not.toBeDisabled();
      });

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            command: '/test',
            text: expect.stringContaining('Test content'),
            contentType: 'text/plain'
          }),
          false // isEdit
        );
      });
    });

    it('should pass isEdit=true when editing', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const initialData = {
        id: '1',
        command: '/test',
        text: 'Test',
        contentType: 'text/plain' as const
      };

      const { container } = render(
        <MacroEditorView
          {...defaultProps}
          initialData={initialData}
          onSubmit={onSubmit}
        />
      );

      const form = container.querySelector('form')!;

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /update/i });
        expect(submitButton).not.toBeDisabled();
      });

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.any(Object), true); // isEdit
      });
    });

    it('should include sensitive flag in submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const { container } = render(<MacroEditorView {...defaultProps} onSubmit={onSubmit} />);

      // Fill form
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '/test' } });

      setEditorContent(container, 'Content');

      // Check sensitive
      fireEvent.click(screen.getByRole('checkbox'));

      const form = container.querySelector('form')!;

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save/i });
        expect(submitButton).not.toBeDisabled();
      });

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            is_sensitive: true
          }),
          false
        );
      });
    });

    it('should show submitting state', async () => {
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      const { container } = render(<MacroEditorView {...defaultProps} onSubmit={onSubmit} />);

      // Fill form
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '/test' } });

      setEditorContent(container, 'Content');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save/i });
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      const { container } = render(<MacroEditorView {...defaultProps} onSubmit={onSubmit} />);

      // Fill form
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '/test' } });

      setEditorContent(container, 'Content');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save/i });
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /saving/i });
        expect(submitButton).toBeDisabled();
      });
    });

    it('should prevent default form submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      const { container } = render(<MacroEditorView {...defaultProps} onSubmit={onSubmit} />);

      // Fill form
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '/test' } });

      setEditorContent(container, 'Content');

      const form = container.querySelector('form')!;

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save/i });
        expect(submitButton).not.toBeDisabled();
      });

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      await act(async () => {
        form.dispatchEvent(submitEvent);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      const initialData = {
        id: '1',
        command: '/test',
        text: 'Test',
        contentType: 'text/plain' as const
      };

      render(<MacroEditorView {...defaultProps} initialData={initialData} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should disable cancel button during submission', async () => {
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      const onCancel = vi.fn();
      const initialData = {
        id: '1',
        command: '/test',
        text: 'Test',
        contentType: 'text/plain' as const
      };

      const { container } = render(
        <MacroEditorView
          {...defaultProps}
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      const form = container.querySelector('form')!;

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /update/i });
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.submit(form);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('Validation Errors', () => {
    it('should show content error when validation fails', async () => {
      const onSubmit = vi.fn().mockResolvedValue({
        success: false,
        error: 'Content is invalid'
      });

      const { container } = render(<MacroEditorView {...defaultProps} onSubmit={onSubmit} />);

      // Fill form
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '/test' } });

      setEditorContent(container, 'Content');

      const form = container.querySelector('form')!;

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save/i });
        expect(submitButton).not.toBeDisabled();
      });

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Content is invalid');
      });
    });

    it('should use custom validation', async () => {
      const onValidate = vi.fn().mockReturnValue({
        content: 'Custom validation error'
      });

      const { container } = render(
        <MacroEditorView {...defaultProps} onValidate={onValidate} />
      );

      // Fill form
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '/test' } });

      setEditorContent(container, 'Content');

      const form = container.querySelector('form')!;

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save/i });
        expect(submitButton).not.toBeDisabled();
      });

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(onValidate).toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent('Custom validation error');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(<MacroEditorView {...defaultProps} />);

      expect(container.querySelector('form')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show error as alert role', async () => {
      const onSubmit = vi.fn().mockResolvedValue({
        success: false,
        error: 'Error message'
      });

      const { container } = render(<MacroEditorView {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '/test' } });

      setEditorContent(container, 'Content');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save/i });
        expect(submitButton).not.toBeDisabled();
      });

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });
});
