/**
 * Tests for CommandInput component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { CommandInput } from './CommandInput';

describe('CommandInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    prefixes: ['/', '#', '@']
  };

  describe('Rendering', () => {
    it('should render input with default props', () => {
      render(<CommandInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with label when provided', () => {
      render(<CommandInput {...defaultProps} label="Command" />);
      expect(screen.getByText('Command')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<CommandInput {...defaultProps} placeholder="Enter command..." />);
      const input = screen.getByPlaceholderText('Enter command...');
      expect(input).toBeInTheDocument();
    });

    it('should render with custom class name', () => {
      const { container } = render(<CommandInput {...defaultProps} className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should auto-focus when autoFocus is true', () => {
      render(<CommandInput {...defaultProps} autoFocus />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<CommandInput {...defaultProps} disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('Value Control', () => {
    it('should display the current value', () => {
      render(<CommandInput {...defaultProps} value="/hello" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('/hello');
    });

    it('should call onChange when user types', () => {
      const onChange = vi.fn();
      render(<CommandInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '/test' } });

      expect(onChange).toHaveBeenCalledWith('/test');
    });

    it('should respect maxLength', () => {
      render(<CommandInput {...defaultProps} maxLength={10} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.maxLength).toBe(10);
    });
  });

  describe('Prefix Validation', () => {
    it('should not show error for empty value', () => {
      render(<CommandInput {...defaultProps} value="" showValidation />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should show error for value without valid prefix', () => {
      render(<CommandInput {...defaultProps} value="test" showValidation />);
      expect(screen.getByRole('alert')).toHaveTextContent('Command must start with: /, #, @');
    });

    it('should not show error for value with valid prefix /', () => {
      render(<CommandInput {...defaultProps} value="/test" showValidation />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not show error for value with valid prefix #', () => {
      render(<CommandInput {...defaultProps} value="#test" showValidation />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not show error for value with valid prefix @', () => {
      render(<CommandInput {...defaultProps} value="@test" showValidation />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should validate with single prefix', () => {
      render(<CommandInput {...defaultProps} prefixes={['/']} value="#test" showValidation />);
      expect(screen.getByRole('alert')).toHaveTextContent('Command must start with: /');
    });

    it('should not show error when showValidation is false', () => {
      render(<CommandInput {...defaultProps} value="test" showValidation={false} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should add error class to input when invalid', () => {
      render(<CommandInput {...defaultProps} value="test" showValidation />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('command-input-error');
    });

    it('should set aria-invalid when invalid', () => {
      render(<CommandInput {...defaultProps} value="test" showValidation />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Custom Validation', () => {
    it('should use custom validation function', () => {
      const customValidation = vi.fn(() => ({
        isValid: false,
        error: 'Custom error message'
      }));

      render(
        <CommandInput
          {...defaultProps}
          value="/test"
          showValidation
          customValidation={customValidation}
        />
      );

      expect(customValidation).toHaveBeenCalledWith('/test');
      expect(screen.getByRole('alert')).toHaveTextContent('Custom error message');
    });

    it('should pass when custom validation returns valid', () => {
      const customValidation = vi.fn(() => ({
        isValid: true
      }));

      render(
        <CommandInput
          {...defaultProps}
          value="/test"
          showValidation
          customValidation={customValidation}
        />
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should check prefix before custom validation', () => {
      const customValidation = vi.fn(() => ({
        isValid: true
      }));

      render(
        <CommandInput
          {...defaultProps}
          value="test"
          showValidation
          customValidation={customValidation}
        />
      );

      // Should show prefix error, not call custom validation
      expect(screen.getByRole('alert')).toHaveTextContent('Command must start with');
      expect(customValidation).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Support', () => {
    it('should call onEnter when Enter is pressed', () => {
      const onEnter = vi.fn();
      render(<CommandInput {...defaultProps} onEnter={onEnter} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onEnter).toHaveBeenCalled();
    });

    it('should prevent default on Enter key', () => {
      const onEnter = vi.fn();
      render(<CommandInput {...defaultProps} onEnter={onEnter} />);

      const input = screen.getByRole('textbox');
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventDefault = vi.spyOn(event, 'preventDefault');

      input.dispatchEvent(event);

      expect(preventDefault).toHaveBeenCalled();
    });

    it('should not call onEnter when other keys are pressed', () => {
      const onEnter = vi.fn();
      render(<CommandInput {...defaultProps} onEnter={onEnter} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'a' });

      expect(onEnter).not.toHaveBeenCalled();
    });

    it('should call onBlur when input loses focus', () => {
      const onBlur = vi.fn();
      render(<CommandInput {...defaultProps} onBlur={onBlur} />);

      const input = screen.getByRole('textbox');
      // Preact compat maps onBlur → focusout; dispatch the real event
      fireEvent(input, new FocusEvent('focusout', { bubbles: true }));

      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Hint Text', () => {
    it('should show hint when value is empty and no error', () => {
      render(<CommandInput {...defaultProps} value="" placeholder="/example" />);
      expect(screen.getByText(/Example:/)).toBeInTheDocument();
    });

    it('should not show hint when value is not empty', () => {
      render(<CommandInput {...defaultProps} value="/test" placeholder="/example" />);
      expect(screen.queryByText(/Example:/)).not.toBeInTheDocument();
    });

    it('should not show hint when there is an error', () => {
      render(<CommandInput {...defaultProps} value="test" showValidation placeholder="/example" />);
      expect(screen.queryByText(/Example:/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should associate label with input', () => {
      render(<CommandInput {...defaultProps} label="Command" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Command');

      expect(input).toHaveAttribute('id', 'command-input');
      expect(label).toHaveAttribute('for', 'command-input');
    });

    it('should associate error message with input', () => {
      render(<CommandInput {...defaultProps} value="test" showValidation />);
      const input = screen.getByRole('textbox');

      expect(input).toHaveAttribute('aria-describedby', 'command-input-error');
      expect(screen.getByRole('alert')).toHaveAttribute('id', 'command-input-error');
    });

    it('should not have aria-describedby when no error', () => {
      render(<CommandInput {...defaultProps} value="/test" showValidation />);
      const input = screen.getByRole('textbox');

      expect(input).not.toHaveAttribute('aria-describedby');
    });
  });
});
