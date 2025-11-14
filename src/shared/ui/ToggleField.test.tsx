/**
 * Tests for ToggleField component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleField } from './ToggleField';

describe('ToggleField', () => {
  const defaultProps = {
    checked: false,
    onChange: vi.fn(),
    label: 'Enable feature'
  };

  describe('Rendering', () => {
    it('should render checkbox with label', () => {
      render(<ToggleField {...defaultProps} />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('Enable feature')).toBeInTheDocument();
    });

    it('should render with description when provided', () => {
      render(<ToggleField {...defaultProps} description="This enables the feature" />);

      expect(screen.getByText('This enables the feature')).toBeInTheDocument();
    });

    it('should render with custom class name', () => {
      const { container } = render(<ToggleField {...defaultProps} className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ToggleField {...defaultProps} disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Checked State', () => {
    it('should be unchecked when checked is false', () => {
      render(<ToggleField {...defaultProps} checked={false} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should be checked when checked is true', () => {
      render(<ToggleField {...defaultProps} checked={true} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should call onChange with true when unchecked checkbox is clicked', () => {
      const onChange = vi.fn();
      render(<ToggleField {...defaultProps} checked={false} onChange={onChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should call onChange with false when checked checkbox is clicked', () => {
      const onChange = vi.fn();
      render(<ToggleField {...defaultProps} checked={true} onChange={onChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('should toggle when label is clicked', () => {
      const onChange = vi.fn();
      render(<ToggleField {...defaultProps} checked={false} onChange={onChange} />);

      const label = screen.getByText('Enable feature');
      fireEvent.click(label);

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Keyboard Support', () => {
    it('should be keyboard accessible', () => {
      render(<ToggleField {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');

      // Checkbox should be keyboard focusable
      checkbox.focus();
      expect(checkbox).toHaveFocus();
    });

    it('should be disabled when disabled prop is true', () => {
      const onChange = vi.fn();
      render(<ToggleField {...defaultProps} disabled onChange={onChange} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();

      // In actual browser, disabled elements don't fire events
      // In jsdom, we can at least verify the disabled attribute
    });
  });

  describe('Form Integration', () => {
    it('should render with name attribute', () => {
      render(<ToggleField {...defaultProps} name="myToggle" />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.name).toBe('myToggle');
    });

    it('should render with custom id', () => {
      render(<ToggleField {...defaultProps} id="custom-id" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'custom-id');
    });

    it('should auto-generate id from label when not provided', () => {
      render(<ToggleField {...defaultProps} label="Enable Feature" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'toggle-enable-feature');
    });

    it('should auto-generate id from name when label has spaces', () => {
      render(<ToggleField {...defaultProps} name="myToggle" />);
      const checkbox = screen.getByRole('checkbox');
      // ID should be generated from name or label
      expect(checkbox.id).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should associate label with checkbox', () => {
      render(<ToggleField {...defaultProps} id="my-toggle" />);

      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText('Enable feature').closest('label');

      expect(label).toHaveAttribute('for', 'my-toggle');
      expect(checkbox).toHaveAttribute('id', 'my-toggle');
    });

    it('should associate description with checkbox using aria-describedby', () => {
      render(
        <ToggleField
          {...defaultProps}
          id="my-toggle"
          description="This enables the feature"
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-describedby', 'my-toggle-description');

      const description = screen.getByText('This enables the feature');
      expect(description).toHaveAttribute('id', 'my-toggle-description');
    });

    it('should not have aria-describedby when no description', () => {
      render(<ToggleField {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Visual State', () => {
    it('should have toggle-field class on container', () => {
      const { container } = render(<ToggleField {...defaultProps} />);
      expect(container.querySelector('.toggle-field')).toBeInTheDocument();
    });

    it('should have toggle-field-label class on label', () => {
      const { container } = render(<ToggleField {...defaultProps} />);
      expect(container.querySelector('.toggle-field-label')).toBeInTheDocument();
    });

    it('should have toggle-field-input class on checkbox', () => {
      const { container } = render(<ToggleField {...defaultProps} />);
      expect(container.querySelector('.toggle-field-input')).toBeInTheDocument();
    });

    it('should have toggle-field-text class on label text', () => {
      const { container } = render(<ToggleField {...defaultProps} />);
      expect(container.querySelector('.toggle-field-text')).toBeInTheDocument();
    });

    it('should have toggle-field-description class on description', () => {
      const { container } = render(<ToggleField {...defaultProps} description="Test description" />);
      expect(container.querySelector('.toggle-field-description')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggling', () => {
      const onChange = vi.fn();
      const { rerender } = render(<ToggleField {...defaultProps} checked={false} onChange={onChange} />);

      const checkbox = screen.getByRole('checkbox');

      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenNthCalledWith(1, true);

      // Re-render with new checked state
      rerender(<ToggleField {...defaultProps} checked={true} onChange={onChange} />);

      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenNthCalledWith(2, false);

      // Re-render again
      rerender(<ToggleField {...defaultProps} checked={false} onChange={onChange} />);

      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledTimes(3);
      expect(onChange).toHaveBeenNthCalledWith(3, true);
    });

    it('should handle empty label', () => {
      render(<ToggleField {...defaultProps} label="" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should handle long label text', () => {
      const longLabel = 'This is a very long label text that might wrap to multiple lines in the UI and should still work correctly';
      render(<ToggleField {...defaultProps} label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle long description text', () => {
      const longDesc = 'This is a very long description that provides detailed information about what this toggle does and why you might want to enable or disable it';
      render(<ToggleField {...defaultProps} description={longDesc} />);
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });
  });
});
