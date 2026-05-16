// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ActionToolbar,
  ActionToolbarProps,
  ToolbarButton,
  registerIcon,
  registerIcons,
  getGlobalIconRegistry
} from './ActionToolbar';

interface TestItem {
  id: string;
  name: string;
}

const mockItems: TestItem[] = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
];

describe('ActionToolbar', () => {
  describe('Rendering', () => {
    it('should render all buttons', () => {
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action: vi.fn() },
        { id: 'edit', icon: 'edit', label: 'Edit', enabled: 'single', action: vi.fn() },
        { id: 'delete', icon: 'trash', label: 'Delete', enabled: 'any', action: vi.fn() },
      ];

      render(<ActionToolbar buttons={buttons} />);

      expect(screen.getByLabelText('New')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action: vi.fn() }
      ];

      render(<ActionToolbar buttons={buttons} className="custom-toolbar" />);

      const toolbar = document.querySelector('.action-toolbar');
      expect(toolbar).toHaveClass('custom-toolbar');
    });

    it('should apply position class', () => {
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action: vi.fn() }
      ];

      const { rerender } = render(<ActionToolbar buttons={buttons} position="header" />);
      let toolbar = document.querySelector('.action-toolbar');
      expect(toolbar).toHaveClass('header');

      rerender(<ActionToolbar buttons={buttons} position="footer" />);
      toolbar = document.querySelector('.action-toolbar');
      expect(toolbar).toHaveClass('footer');
    });

    it('should show shortcuts in button labels', () => {
      const buttons: ToolbarButton[] = [
        {
          id: 'new',
          icon: 'plus',
          label: 'New',
          enabled: 'always',
          action: vi.fn(),
          shortcut: 'n'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const button = screen.getByLabelText('New (n)');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Button Enable/Disable States', () => {
    it('should always enable buttons with enabled="always"', () => {
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action: vi.fn() }
      ];

      const { rerender } = render(
        <ActionToolbar buttons={buttons} selectionCount={0} />
      );
      expect(screen.getByLabelText('New')).not.toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={5} />);
      expect(screen.getByLabelText('New')).not.toBeDisabled();
    });

    it('should enable buttons with enabled="single" only when one item selected', () => {
      const buttons: ToolbarButton[] = [
        { id: 'edit', icon: 'edit', label: 'Edit', enabled: 'single', action: vi.fn() }
      ];

      const { rerender } = render(
        <ActionToolbar buttons={buttons} selectionCount={0} />
      );
      expect(screen.getByLabelText('Edit')).toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={1} />);
      expect(screen.getByLabelText('Edit')).not.toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={2} />);
      expect(screen.getByLabelText('Edit')).toBeDisabled();
    });

    it('should enable buttons with enabled="multiple" only when multiple items selected', () => {
      const buttons: ToolbarButton[] = [
        { id: 'merge', icon: 'plus', label: 'Merge', enabled: 'multiple', action: vi.fn() }
      ];

      const { rerender } = render(
        <ActionToolbar buttons={buttons} selectionCount={0} />
      );
      expect(screen.getByLabelText('Merge')).toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={1} />);
      expect(screen.getByLabelText('Merge')).toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={2} />);
      expect(screen.getByLabelText('Merge')).not.toBeDisabled();
    });

    it('should enable buttons with enabled="any" when at least one item selected', () => {
      const buttons: ToolbarButton[] = [
        { id: 'delete', icon: 'trash', label: 'Delete', enabled: 'any', action: vi.fn() }
      ];

      const { rerender } = render(
        <ActionToolbar buttons={buttons} selectionCount={0} />
      );
      expect(screen.getByLabelText('Delete')).toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={1} />);
      expect(screen.getByLabelText('Delete')).not.toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={5} />);
      expect(screen.getByLabelText('Delete')).not.toBeDisabled();
    });

    it('should enable buttons with enabled="none" only when no items selected', () => {
      const buttons: ToolbarButton[] = [
        { id: 'clear', icon: 'cancel', label: 'Clear', enabled: 'none', action: vi.fn() }
      ];

      const { rerender } = render(
        <ActionToolbar buttons={buttons} selectionCount={0} />
      );
      expect(screen.getByLabelText('Clear')).not.toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={1} />);
      expect(screen.getByLabelText('Clear')).toBeDisabled();
    });

    it('should support custom enable function', () => {
      const buttons: ToolbarButton[] = [
        {
          id: 'custom',
          icon: 'plus',
          label: 'Custom',
          enabled: (count) => count === 3 || count === 5,
          action: vi.fn()
        }
      ];

      const { rerender } = render(
        <ActionToolbar buttons={buttons} selectionCount={1} />
      );
      expect(screen.getByLabelText('Custom')).toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={3} />);
      expect(screen.getByLabelText('Custom')).not.toBeDisabled();

      rerender(<ActionToolbar buttons={buttons} selectionCount={5} />);
      expect(screen.getByLabelText('Custom')).not.toBeDisabled();
    });
  });

  describe('Button Actions', () => {
    it('should call action when button is clicked', () => {
      const action = vi.fn();
      const buttons: ToolbarButton<TestItem>[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action }
      ];

      render(
        <ActionToolbar
          buttons={buttons}
          selectedItems={mockItems}
        />
      );

      fireEvent.click(screen.getByLabelText('New'));

      expect(action).toHaveBeenCalledWith(mockItems);
    });

    it('should call onAction callback when button is clicked', () => {
      const action = vi.fn();
      const onAction = vi.fn();
      const buttons: ToolbarButton<TestItem>[] = [
        { id: 'edit', icon: 'edit', label: 'Edit', enabled: 'always', action }
      ];

      render(
        <ActionToolbar
          buttons={buttons}
          selectedItems={mockItems}
          onAction={onAction}
        />
      );

      fireEvent.click(screen.getByLabelText('Edit'));

      expect(onAction).toHaveBeenCalledWith('edit', mockItems);
    });

    it('should not call action when button is disabled', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        { id: 'edit', icon: 'edit', label: 'Edit', enabled: 'single', action }
      ];

      render(
        <ActionToolbar buttons={buttons} selectionCount={0} />
      );

      fireEvent.click(screen.getByLabelText('Edit'));

      expect(action).not.toHaveBeenCalled();
    });

    it('should pass correct selected items to action', () => {
      const action = vi.fn();
      const buttons: ToolbarButton<TestItem>[] = [
        { id: 'delete', icon: 'trash', label: 'Delete', enabled: 'any', action }
      ];

      const selectedItems = [mockItems[0], mockItems[2]];

      render(
        <ActionToolbar
          buttons={buttons}
          selectedItems={selectedItems}
          selectionCount={2}
        />
      );

      fireEvent.click(screen.getByLabelText('Delete'));

      expect(action).toHaveBeenCalledWith(selectedItems);
    });
  });

  describe('Icons', () => {
    it('should render default emoji icons', () => {
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action: vi.fn() },
        { id: 'edit', icon: 'edit', label: 'Edit', enabled: 'always', action: vi.fn() },
        { id: 'delete', icon: 'trash', label: 'Delete', enabled: 'always', action: vi.fn() },
      ];

      render(<ActionToolbar buttons={buttons} />);

      expect(screen.getByText('➕')).toBeInTheDocument();
      expect(screen.getByText('✏️')).toBeInTheDocument();
      expect(screen.getByText('🗑️')).toBeInTheDocument();
    });

    it('should render custom emoji icons', () => {
      const buttons: ToolbarButton[] = [
        { id: 'custom', icon: '🎨', label: 'Custom', enabled: 'always', action: vi.fn() }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const button = screen.getByLabelText('Custom');
      const iconSpan = button.querySelector('.icon-text');
      expect(iconSpan).toBeInTheDocument();
      expect(iconSpan?.textContent).toBe('🎨');
    });

    it('should render SVG icons', () => {
      const buttons: ToolbarButton[] = [
        {
          id: 'svg',
          icon: '<svg><circle r="5" /></svg>',
          label: 'SVG',
          enabled: 'always',
          action: vi.fn()
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render icon font classes', () => {
      const buttons: ToolbarButton[] = [
        {
          id: 'font-icon',
          icon: { type: 'font', class: 'fa fa-star' },
          label: 'Font Icon',
          enabled: 'always',
          action: vi.fn()
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const icon = document.querySelector('.fa.fa-star');
      expect(icon).toBeInTheDocument();
    });

    it('should render function-based icons', () => {
      const buttons: ToolbarButton[] = [
        {
          id: 'fn-icon',
          icon: () => <span data-testid="custom-icon">Custom</span>,
          label: 'Function Icon',
          enabled: 'always',
          action: vi.fn()
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should use custom icon registry', () => {
      const buttons: ToolbarButton[] = [
        { id: 'custom', icon: 'star', label: 'Star', enabled: 'always', action: vi.fn() }
      ];

      const iconRegistry = { star: '⭐' };

      render(<ActionToolbar buttons={buttons} iconRegistry={iconRegistry} />);

      expect(screen.getByText('⭐')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should trigger action on keyboard shortcut', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'new',
          icon: 'plus',
          label: 'New',
          enabled: 'always',
          action,
          shortcut: 'n'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      fireEvent.keyDown(window, { key: 'n' });

      expect(action).toHaveBeenCalled();
    });

    it('should be case-insensitive for shortcuts', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'new',
          icon: 'plus',
          label: 'New',
          enabled: 'always',
          action,
          shortcut: 'N'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      fireEvent.keyDown(window, { key: 'n' });

      expect(action).toHaveBeenCalled();
    });

    it('should not trigger shortcuts when button is disabled', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'edit',
          icon: 'edit',
          label: 'Edit',
          enabled: 'single',
          action,
          shortcut: 'e'
        }
      ];

      render(<ActionToolbar buttons={buttons} selectionCount={0} />);

      fireEvent.keyDown(window, { key: 'e' });

      expect(action).not.toHaveBeenCalled();
    });

    it('should not register shortcuts when enableShortcuts is false', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'new',
          icon: 'plus',
          label: 'New',
          enabled: 'always',
          action,
          shortcut: 'n'
        }
      ];

      render(<ActionToolbar buttons={buttons} enableShortcuts={false} />);

      fireEvent.keyDown(window, { key: 'n' });

      expect(action).not.toHaveBeenCalled();
    });

    it('should support special key shortcuts', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'delete',
          icon: 'trash',
          label: 'Delete',
          enabled: 'always',
          action,
          shortcut: 'Delete'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      fireEvent.keyDown(window, { key: 'Delete' });

      expect(action).toHaveBeenCalled();
    });

    it('should prevent default on shortcut activation', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'save',
          icon: 'save',
          label: 'Save',
          enabled: 'always',
          action,
          shortcut: 's'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const event = new KeyboardEvent('keydown', { key: 's', bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should cleanup shortcuts on unmount', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'new',
          icon: 'plus',
          label: 'New',
          enabled: 'always',
          action,
          shortcut: 'n'
        }
      ];

      const { unmount } = render(<ActionToolbar buttons={buttons} />);

      unmount();

      fireEvent.keyDown(window, { key: 'n' });

      expect(action).not.toHaveBeenCalled();
    });

    it('should support Ctrl modifier (ctrl+n)', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'new',
          icon: 'plus',
          label: 'New',
          enabled: 'always',
          action,
          shortcut: 'ctrl+n'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      // Should trigger with Ctrl+N
      fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
      expect(action).toHaveBeenCalledTimes(1);

      // Should NOT trigger with just 'n'
      fireEvent.keyDown(window, { key: 'n' });
      expect(action).toHaveBeenCalledTimes(1); // Still just once
    });

    it('should support Alt modifier (alt+d)', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'delete',
          icon: 'trash',
          label: 'Delete',
          enabled: 'always',
          action,
          shortcut: 'alt+d'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      // Should trigger with Alt+D
      fireEvent.keyDown(window, { key: 'd', altKey: true });
      expect(action).toHaveBeenCalledTimes(1);

      // Should NOT trigger with just 'd'
      fireEvent.keyDown(window, { key: 'd' });
      expect(action).toHaveBeenCalledTimes(1); // Still just once
    });

    it('should support Shift modifier (shift+delete)', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'delete',
          icon: 'trash',
          label: 'Delete',
          enabled: 'always',
          action,
          shortcut: 'shift+delete'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      // Should trigger with Shift+Delete
      fireEvent.keyDown(window, { key: 'delete', shiftKey: true });
      expect(action).toHaveBeenCalledTimes(1);

      // Should NOT trigger with just 'delete'
      fireEvent.keyDown(window, { key: 'delete' });
      expect(action).toHaveBeenCalledTimes(1); // Still just once
    });

    it('should support Meta/Cmd key as Ctrl on Mac (cmd+n)', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        {
          id: 'new',
          icon: 'plus',
          label: 'New',
          enabled: 'always',
          action,
          shortcut: 'ctrl+n'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      // Should trigger with Cmd+N (metaKey) on Mac
      fireEvent.keyDown(window, { key: 'n', metaKey: true });
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('Global Icon Registry', () => {
    beforeEach(() => {
      // Reset global registry
      registerIcons({
        'plus': '➕',
        'edit': '✏️',
        'trash': '🗑️'
      });
    });

    it('should register single icon', () => {
      registerIcon('star', '⭐');

      const registry = getGlobalIconRegistry();
      expect(registry['star']).toBe('⭐');
    });

    it('should register multiple icons', () => {
      registerIcons({
        heart: '❤️',
        fire: '🔥'
      });

      const registry = getGlobalIconRegistry();
      expect(registry['heart']).toBe('❤️');
      expect(registry['fire']).toBe('🔥');
    });

    it('should preserve existing icons when registering new ones', () => {
      registerIcon('star', '⭐');

      const registry = getGlobalIconRegistry();
      expect(registry['plus']).toBe('➕'); // Original icon preserved
      expect(registry['star']).toBe('⭐'); // New icon added
    });
  });

  describe('Accessibility', () => {
    it('should have role="toolbar"', () => {
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action: vi.fn() }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const toolbar = document.querySelector('[role="toolbar"]');
      expect(toolbar).toBeInTheDocument();
    });

    it('should have aria-label on toolbar', () => {
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action: vi.fn() }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const toolbar = document.querySelector('[role="toolbar"]');
      expect(toolbar).toHaveAttribute('aria-label', 'Actions');
    });

    it('should have aria-label on each button', () => {
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New Item', enabled: 'always', action: vi.fn() }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const button = screen.getByLabelText('New Item');
      expect(button).toHaveAttribute('aria-label', 'New Item');
    });

    it('should set aria-disabled on disabled buttons', () => {
      const buttons: ToolbarButton[] = [
        { id: 'edit', icon: 'edit', label: 'Edit', enabled: 'single', action: vi.fn() }
      ];

      render(<ActionToolbar buttons={buttons} selectionCount={0} />);

      const button = screen.getByLabelText('Edit');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('should have title attribute for tooltips', () => {
      const buttons: ToolbarButton[] = [
        {
          id: 'new',
          icon: 'plus',
          label: 'New',
          enabled: 'always',
          action: vi.fn(),
          shortcut: 'n'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const button = screen.getByLabelText('New (n)');
      expect(button).toHaveAttribute('title', 'New (n)');
    });
  });

  describe('Custom Button Classes', () => {
    it('should apply custom className to button', () => {
      const buttons: ToolbarButton[] = [
        {
          id: 'new',
          icon: 'plus',
          label: 'New',
          enabled: 'always',
          action: vi.fn(),
          className: 'primary-button'
        }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const button = screen.getByLabelText('New');
      expect(button).toHaveClass('primary-button');
    });

    it('should apply enabled/disabled class based on state', () => {
      const buttons: ToolbarButton[] = [
        { id: 'edit', icon: 'edit', label: 'Edit', enabled: 'single', action: vi.fn() }
      ];

      const { rerender } = render(
        <ActionToolbar buttons={buttons} selectionCount={0} />
      );

      let button = screen.getByLabelText('Edit');
      expect(button).toHaveClass('disabled');
      expect(button).not.toHaveClass('enabled');

      rerender(<ActionToolbar buttons={buttons} selectionCount={1} />);

      button = screen.getByLabelText('Edit');
      expect(button).toHaveClass('enabled');
      expect(button).not.toHaveClass('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty buttons array', () => {
      render(<ActionToolbar buttons={[]} />);

      const toolbar = document.querySelector('[role="toolbar"]');
      expect(toolbar).toBeInTheDocument();
      expect(toolbar?.children.length).toBe(0);
    });

    it('should handle undefined selectedItems', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action }
      ];

      render(<ActionToolbar buttons={buttons} />);

      fireEvent.click(screen.getByLabelText('New'));

      expect(action).toHaveBeenCalledWith([]);
    });

    it('should handle buttons without shortcuts', () => {
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action: vi.fn() }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const button = screen.getByLabelText('New');
      expect(button).toHaveAttribute('aria-label', 'New');
      expect(button).toHaveAttribute('title', 'New');
    });

    it('should handle rapid button clicks', () => {
      const action = vi.fn();
      const buttons: ToolbarButton[] = [
        { id: 'new', icon: 'plus', label: 'New', enabled: 'always', action }
      ];

      render(<ActionToolbar buttons={buttons} />);

      const button = screen.getByLabelText('New');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(action).toHaveBeenCalledTimes(3);
    });
  });
});
