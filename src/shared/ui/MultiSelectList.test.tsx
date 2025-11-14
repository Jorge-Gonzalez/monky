// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MultiSelectList, MultiSelectListProps } from './MultiSelectList';

interface TestItem {
  id: string;
  name: string;
  value: number;
}

const mockItems: TestItem[] = [
  { id: '1', name: 'First Item', value: 10 },
  { id: '2', name: 'Second Item', value: 20 },
  { id: '3', name: 'Third Item', value: 30 },
  { id: '4', name: 'Fourth Item', value: 40 },
  { id: '5', name: 'Fifth Item', value: 50 },
];

const defaultProps: MultiSelectListProps<TestItem> = {
  items: mockItems,
  itemKey: 'id',
  renderItem: (item) => <div data-testid={`item-${item.id}`}>{item.name}</div>,
};

describe('MultiSelectList', () => {
  describe('Rendering', () => {
    it('should render all items', () => {
      render(<MultiSelectList {...defaultProps} />);

      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
      expect(screen.getByTestId('item-4')).toBeInTheDocument();
      expect(screen.getByTestId('item-5')).toBeInTheDocument();
    });

    it('should render empty state when no items', () => {
      render(<MultiSelectList {...defaultProps} items={[]} />);

      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    it('should render custom empty state', () => {
      render(
        <MultiSelectList
          {...defaultProps}
          items={[]}
          emptyState={<div>Custom empty message</div>}
        />
      );

      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });

    it('should use custom className', () => {
      render(<MultiSelectList {...defaultProps} className="custom-class" />);

      const list = document.querySelector('.multi-select-list');
      expect(list).toHaveClass('custom-class');
    });
  });

  describe('Selection - Single Click', () => {
    it('should select item on click', () => {
      const onSelect = vi.fn();
      render(<MultiSelectList {...defaultProps} onSelect={onSelect} />);

      const firstItem = screen.getByTestId('item-1');
      fireEvent.click(firstItem);

      expect(onSelect).toHaveBeenCalledWith(['1'], [mockItems[0]]);
    });

    it('should replace selection on second click without Ctrl', () => {
      const onSelect = vi.fn();
      render(<MultiSelectList {...defaultProps} onSelect={onSelect} />);

      const firstItem = screen.getByTestId('item-1');
      const secondItem = screen.getByTestId('item-2');

      fireEvent.click(firstItem);
      fireEvent.click(secondItem);

      expect(onSelect).toHaveBeenLastCalledWith(['2'], [mockItems[1]]);
    });

    it('should add visual selection class to selected item', () => {
      render(<MultiSelectList {...defaultProps} />);

      const firstItem = screen.getByTestId('item-1');
      fireEvent.click(firstItem);

      const listItem = firstItem.closest('.list-item');
      expect(listItem).toHaveClass('selected');
    });
  });

  describe('Selection - Multi-select', () => {
    it('should add item to selection with Ctrl+Click', () => {
      const onSelect = vi.fn();
      render(<MultiSelectList {...defaultProps} onSelect={onSelect} />);

      const firstItem = screen.getByTestId('item-1');
      const secondItem = screen.getByTestId('item-2');

      fireEvent.click(firstItem);
      fireEvent.click(secondItem, { ctrlKey: true });

      expect(onSelect).toHaveBeenLastCalledWith(
        expect.arrayContaining(['1', '2']),
        expect.arrayContaining([mockItems[0], mockItems[1]])
      );
    });

    it('should toggle selection with Ctrl+Click on selected item', () => {
      const onSelect = vi.fn();
      render(<MultiSelectList {...defaultProps} onSelect={onSelect} />);

      const firstItem = screen.getByTestId('item-1');

      fireEvent.click(firstItem);
      fireEvent.click(firstItem, { ctrlKey: true });

      expect(onSelect).toHaveBeenLastCalledWith([], []);
    });

    it('should support Meta key (Mac) for multi-select', () => {
      const onSelect = vi.fn();
      render(<MultiSelectList {...defaultProps} onSelect={onSelect} />);

      const firstItem = screen.getByTestId('item-1');
      const secondItem = screen.getByTestId('item-2');

      fireEvent.click(firstItem);
      fireEvent.click(secondItem, { metaKey: true });

      expect(onSelect).toHaveBeenLastCalledWith(
        expect.arrayContaining(['1', '2']),
        expect.arrayContaining([mockItems[0], mockItems[1]])
      );
    });

    it('should disable multi-select when multiSelect is false', () => {
      const onSelect = vi.fn();
      render(
        <MultiSelectList
          {...defaultProps}
          onSelect={onSelect}
          selectionConfig={{ multiSelect: false }}
        />
      );

      const firstItem = screen.getByTestId('item-1');
      const secondItem = screen.getByTestId('item-2');

      fireEvent.click(firstItem);
      fireEvent.click(secondItem, { ctrlKey: true });

      expect(onSelect).toHaveBeenLastCalledWith(['2'], [mockItems[1]]);
    });
  });

  describe('Activation', () => {
    it('should call onActivate on double-click', () => {
      const onActivate = vi.fn();
      render(<MultiSelectList {...defaultProps} onActivate={onActivate} />);

      const firstItem = screen.getByTestId('item-1');
      fireEvent.doubleClick(firstItem);

      expect(onActivate).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should call onActivate on Enter key', () => {
      const onActivate = vi.fn();
      render(<MultiSelectList {...defaultProps} onActivate={onActivate} />);

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      fireEvent.keyDown(list, { key: 'Enter' });

      expect(onActivate).toHaveBeenCalledWith(mockItems[0]);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should move focus down with ArrowDown', () => {
      render(<MultiSelectList {...defaultProps} />);

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      fireEvent.keyDown(list, { key: 'ArrowDown' });

      const items = document.querySelectorAll('.list-item');
      expect(items[1]).toHaveClass('focused');
    });

    it('should move focus up with ArrowUp', () => {
      render(<MultiSelectList {...defaultProps} />);

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      fireEvent.keyDown(list, { key: 'ArrowDown' }); // Move to second item
      fireEvent.keyDown(list, { key: 'ArrowDown' }); // Move to third item
      fireEvent.keyDown(list, { key: 'ArrowUp' }); // Move back to second item

      const items = document.querySelectorAll('.list-item');
      expect(items[1]).toHaveClass('focused');
    });

    it('should wrap to first item when ArrowDown from last item (wrapNavigation: true)', () => {
      render(
        <MultiSelectList
          {...defaultProps}
          selectionConfig={{ wrapNavigation: true }}
        />
      );

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      // Navigate to last item
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(list, { key: 'ArrowDown' });
      }

      const items = document.querySelectorAll('.list-item');
      expect(items[0]).toHaveClass('focused');
    });

    it('should stay at last item when ArrowDown from last item (wrapNavigation: false)', () => {
      render(
        <MultiSelectList
          {...defaultProps}
          selectionConfig={{ wrapNavigation: false }}
        />
      );

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      // Navigate past last item
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(list, { key: 'ArrowDown' });
      }

      const items = document.querySelectorAll('.list-item');
      expect(items[4]).toHaveClass('focused');
    });

    it('should wrap to last item when ArrowUp from first item (wrapNavigation: true)', () => {
      render(
        <MultiSelectList
          {...defaultProps}
          selectionConfig={{ wrapNavigation: true }}
        />
      );

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      fireEvent.keyDown(list, { key: 'ArrowUp' });

      const items = document.querySelectorAll('.list-item');
      expect(items[4]).toHaveClass('focused');
    });

    it('should call onNavigationEscape when ArrowUp from first item', () => {
      const onNavigationEscape = vi.fn();
      render(
        <MultiSelectList
          {...defaultProps}
          onNavigationEscape={onNavigationEscape}
        />
      );

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      fireEvent.keyDown(list, { key: 'ArrowUp' });

      expect(onNavigationEscape).toHaveBeenCalled();
    });

    it('should not navigate when keyboardNav is false', () => {
      render(<MultiSelectList {...defaultProps} keyboardNav={false} />);

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      fireEvent.keyDown(list, { key: 'ArrowDown' });

      const items = document.querySelectorAll('.list-item.focused');
      expect(items.length).toBe(0);
    });

    it('should not show focused class when keyboardNav is false', () => {
      render(<MultiSelectList {...defaultProps} keyboardNav={false} />);

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      const items = document.querySelectorAll('.list-item');
      items.forEach(item => {
        expect(item).not.toHaveClass('focused');
      });
    });
  });

  describe('Controlled Selection', () => {
    it('should support controlled selection', () => {
      const { rerender } = render(
        <MultiSelectList {...defaultProps} selection={['1', '2']} />
      );

      let items = document.querySelectorAll('.list-item.selected');
      expect(items.length).toBe(2);

      rerender(<MultiSelectList {...defaultProps} selection={['3']} />);

      items = document.querySelectorAll('.list-item.selected');
      expect(items.length).toBe(1);
      expect(items[0].querySelector('[data-testid="item-3"]')).toBeInTheDocument();
    });
  });

  describe('Item Key Functions', () => {
    it('should support function as itemKey', () => {
      const onSelect = vi.fn();
      const itemKeyFn = (item: TestItem) => `key-${item.id}`;

      render(
        <MultiSelectList
          {...defaultProps}
          itemKey={itemKeyFn}
          onSelect={onSelect}
        />
      );

      const firstItem = screen.getByTestId('item-1');
      fireEvent.click(firstItem);

      expect(onSelect).toHaveBeenCalledWith(['key-1'], [mockItems[0]]);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(<MultiSelectList {...defaultProps} />);

      const list = document.querySelector('[role="listbox"]');
      expect(list).toBeInTheDocument();

      const items = document.querySelectorAll('[role="option"]');
      expect(items.length).toBe(5);
    });

    it('should set aria-multiselectable based on config', () => {
      const { rerender } = render(
        <MultiSelectList
          {...defaultProps}
          selectionConfig={{ multiSelect: true }}
        />
      );

      let list = document.querySelector('[role="listbox"]');
      expect(list).toHaveAttribute('aria-multiselectable', 'true');

      rerender(
        <MultiSelectList
          {...defaultProps}
          selectionConfig={{ multiSelect: false }}
        />
      );

      list = document.querySelector('[role="listbox"]');
      expect(list).toHaveAttribute('aria-multiselectable', 'false');
    });

    it('should set aria-selected on selected items', () => {
      render(<MultiSelectList {...defaultProps} />);

      const firstItem = screen.getByTestId('item-1');
      fireEvent.click(firstItem);

      const listItem = firstItem.closest('[role="option"]');
      expect(listItem).toHaveAttribute('aria-selected', 'true');
    });

    it('should be keyboard focusable', () => {
      render(<MultiSelectList {...defaultProps} />);

      const list = document.querySelector('.multi-select-list');
      expect(list).toHaveAttribute('tabindex', '0');
    });

    it('should update aria-activedescendant on focus change', () => {
      render(<MultiSelectList {...defaultProps} />);

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      fireEvent.keyDown(list, { key: 'ArrowDown' });

      expect(list).toHaveAttribute('aria-activedescendant', 'item-1');
    });
  });

  describe('Focus Management', () => {
    it('should call onFocusItem when item receives focus', () => {
      const onFocusItem = vi.fn();
      render(<MultiSelectList {...defaultProps} onFocusItem={onFocusItem} />);

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      fireEvent.keyDown(list, { key: 'ArrowDown' });

      expect(onFocusItem).toHaveBeenCalledWith(mockItems[1], 1);
    });

    it('should update focused index when clicking item', () => {
      render(<MultiSelectList {...defaultProps} />);

      const thirdItem = screen.getByTestId('item-3');
      fireEvent.click(thirdItem);

      const listItem = thirdItem.closest('.list-item');
      expect(listItem).toHaveClass('focused');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const onSelect = vi.fn();
      render(<MultiSelectList {...defaultProps} items={[]} onSelect={onSelect} />);

      expect(screen.getByText('No items')).toBeInTheDocument();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should reset focused index when items change and current is out of bounds', async () => {
      const { rerender } = render(<MultiSelectList {...defaultProps} />);

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      // Navigate to last item (starts at 0, press down 4 times to get to index 4)
      for (let i = 0; i < 4; i++) {
        fireEvent.keyDown(list, { key: 'ArrowDown' });
      }

      // Verify we're at the last item before reducing
      let items = document.querySelectorAll('.list-item');
      expect(items[4]).toHaveClass('focused');

      // Reduce items to 2 (focused index 4 is now out of bounds, should reset to last valid index 1)
      rerender(<MultiSelectList {...defaultProps} items={mockItems.slice(0, 2)} />);

      await waitFor(() => {
        items = document.querySelectorAll('.list-item');
        // Component resets to last valid index (items.length - 1 = 1)
        expect(items.length).toBe(2);
        expect(items[1]).toHaveClass('focused');
      });
    });

    it('should handle rapid keyboard navigation', () => {
      render(<MultiSelectList {...defaultProps} />);

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      // Rapid navigation
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(list, { key: 'ArrowDown' });
      }

      const items = document.querySelectorAll('.list-item');
      const focusedItems = Array.from(items).filter(item => item.classList.contains('focused'));
      expect(focusedItems.length).toBe(1);
    });
  });
});
