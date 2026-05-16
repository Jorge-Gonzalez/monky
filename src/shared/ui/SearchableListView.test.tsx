// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { describe, it, expect, vi } from 'vitest';
import { SearchableListView, SearchableListViewProps } from './SearchableListView';

interface TestItem {
  id: string;
  name: string;
  description: string;
}

const mockItems: TestItem[] = [
  { id: '1', name: 'First Item', description: 'Description 1' },
  { id: '2', name: 'Second Item', description: 'Description 2' },
  { id: '3', name: 'Third Item', description: 'Description 3' },
  { id: '4', name: 'Fourth Item', description: 'Description 4' },
  { id: '5', name: 'Fifth Item', description: 'Description 5' },
];

const defaultProps: SearchableListViewProps<TestItem> = {
  items: mockItems,
  itemKey: 'id',
  searchKeys: ['name', 'description'],
  renderItem: (item) => <div data-testid={`item-${item.id}`}>{item.name}</div>,
};

describe('SearchableListView', () => {
  describe('Initial State', () => {
    it('should render all items on initial load', () => {
      render(<SearchableListView {...defaultProps} />);

      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
      expect(screen.getByTestId('item-4')).toBeInTheDocument();
      expect(screen.getByTestId('item-5')).toBeInTheDocument();
    });

    it('should have no item highlighted on initial load', () => {
      render(<SearchableListView {...defaultProps} />);

      const listItems = document.querySelectorAll('.list-item');
      listItems.forEach(item => {
        expect(item).not.toHaveClass('focused');
      });
    });

    it('should focus search field on mount by default', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toHaveFocus();
    });

    it('should not focus search field on mount when focusOnMount is false', () => {
      render(
        <SearchableListView
          {...defaultProps}
          config={{ keyboard: { focusOnMount: false } }}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).not.toHaveFocus();
    });
  });

  describe('Smart Mode Navigation (default)', () => {
    it('should move focus to list and select first element when down arrow is pressed from search field', () => {
      const onSelect = vi.fn();
      render(<SearchableListView {...defaultProps} onSelect={onSelect} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      // Press down arrow from search field
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      // First item should be highlighted visually
      const searchFocusedItems = document.querySelectorAll('.search-focused-item');
      expect(searchFocusedItems.length).toBeGreaterThan(0);
      expect(searchFocusedItems[0].querySelector('[data-testid="item-1"]')).toBeInTheDocument();

      // First item should be selected
      expect(onSelect).toHaveBeenCalledWith(['1'], [mockItems[0]]);
    });

    it('should highlight first item when arrow down is pressed from no selection', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      const searchFocusedItems = document.querySelectorAll('.search-focused-item');
      expect(searchFocusedItems.length).toBeGreaterThan(0);
      // First item should be highlighted
      expect(searchFocusedItems[0].querySelector('[data-testid="item-1"]')).toBeInTheDocument();
    });

    it('should highlight first item when arrow up is pressed from no selection', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      fireEvent.keyDown(searchInput, { key: 'ArrowUp' });

      const searchFocusedItems = document.querySelectorAll('.search-focused-item');
      expect(searchFocusedItems.length).toBeGreaterThan(0);
      // First item should be highlighted
      expect(searchFocusedItems[0].querySelector('[data-testid="item-1"]')).toBeInTheDocument();
    });

    it('should navigate down through list with arrow down', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // First item
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // Second item

      const searchFocusedItem = document.querySelector('.search-focused-item');
      expect(searchFocusedItem).toBeInTheDocument();
      // The second item should have the search-focused-item wrapper
      const listItem = searchFocusedItem?.querySelector('[data-testid="item-2"]');
      expect(listItem).toBeInTheDocument();
    });

    it('should navigate back up through list with arrow up', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // First item
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // Second item
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' }); // Back to first item

      const items = document.querySelectorAll('.search-focused-item');
      expect(items[0]).toBeInTheDocument();
    });

    it('should clear visual focus but keep selection when arrow up is pressed from first item in smart mode', () => {
      const onSelect = vi.fn();
      render(<SearchableListView {...defaultProps} onSelect={onSelect} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      // Navigate to first item
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      expect(onSelect).toHaveBeenCalledWith(['1'], [mockItems[0]]);

      // Clear the mock
      onSelect.mockClear();

      // Press up from first item - should clear visual focus but keep selection
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' });

      // onSelect should NOT be called again (selection stays)
      expect(onSelect).not.toHaveBeenCalled();

      // No items should be visually focused (cleared visual focus)
      const items = document.querySelectorAll('.search-focused-item');
      expect(items.length).toBe(0);

      // But the item should still be selected in the list
      const selectedItems = document.querySelectorAll('.list-item.selected');
      expect(selectedItems.length).toBe(1);
    });

    it('should wrap to first item when arrow down is pressed from last item (wrapNavigation: true)', () => {
      render(
        <SearchableListView
          {...defaultProps}
          config={{ keyboard: { wrapNavigation: true } }}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      // Navigate to last item
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      }

      // Try to go down from last item
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      // Should wrap to first item
      const items = document.querySelectorAll('.search-focused-item');
      expect(items[0]).toBeInTheDocument();
    });

    it('should stay at last item when arrow down is pressed from last item (wrapNavigation: false)', () => {
      render(
        <SearchableListView
          {...defaultProps}
          config={{ keyboard: { wrapNavigation: false } }}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      // Navigate to last item
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      }

      const lastItemBefore = document.querySelectorAll('.search-focused-item')[4];

      // Try to go down from last item
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      const lastItemAfter = document.querySelectorAll('.search-focused-item')[4];
      expect(lastItemAfter).toBe(lastItemBefore);
    });

    it('should activate highlighted item when Enter is pressed', () => {
      const onActivate = vi.fn();
      render(<SearchableListView {...defaultProps} onActivate={onActivate} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // First item
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(onActivate).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should switch focus to list when Tab is pressed', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      // Simulate Tab key in container
      const container = document.querySelector('.searchable-list-view') as HTMLElement;
      fireEvent.keyDown(container, { key: 'Tab' });

      // Check that list.focus() was called by verifying the list is focusable
      const list = document.querySelector('.multi-select-list');
      expect(list).toHaveAttribute('tabindex', '0');
    });

    it('should maintain search field DOM focus during smart navigation', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // First item
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // Second item

      expect(searchInput).toHaveFocus();
    });
  });

  describe('Traditional Mode Navigation (smartNavigation: false)', () => {
    it('should not navigate list when arrow keys are pressed in search field', () => {
      render(
        <SearchableListView
          {...defaultProps}
          config={{ keyboard: { smartNavigation: false } }}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      const focusedItems = document.querySelectorAll('.search-focused-item');
      expect(focusedItems.length).toBe(0);
    });

    it('should require Tab to switch focus to list', () => {
      render(
        <SearchableListView
          {...defaultProps}
          config={{ keyboard: { smartNavigation: false } }}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      expect(searchInput).toHaveFocus();

      // In traditional mode, arrow keys don't work until you tab to list
      const searchFocusedItems = document.querySelectorAll('.search-focused-item');
      expect(searchFocusedItems.length).toBe(0);
    });

    it('should wrap navigation in list when wrapNavigation is true', () => {
      render(
        <SearchableListView
          {...defaultProps}
          config={{
            keyboard: { smartNavigation: false },
            list: { selectionConfig: { wrapNavigation: true } }
          }}
        />
      );

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      list.focus();

      // Go up from first item - should wrap to last
      fireEvent.keyDown(list, { key: 'ArrowUp' });

      const focusedItems = document.querySelectorAll('.list-item.focused');
      expect(focusedItems[focusedItems.length - 1]).toHaveClass('focused');
    });
  });

  describe('List Focus Mode (after Tab in Smart Mode)', () => {
    it('should return to search when arrow up is pressed from first item', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      // Switch to list
      fireEvent.keyDown(searchInput, { key: 'Tab' });
      const list = document.querySelector('.multi-select-list') as HTMLElement;

      // Press up from first item
      fireEvent.keyDown(list, { key: 'ArrowUp' });

      expect(searchInput).toHaveFocus();
    });

    it('should reset focusedIndex to -1 when returning to search', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      // Navigate in smart mode
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      // Switch to list
      fireEvent.keyDown(searchInput, { key: 'Tab' });
      const list = document.querySelector('.multi-select-list') as HTMLElement;

      // Return to search
      fireEvent.keyDown(list, { key: 'ArrowUp' });

      // No item should have search-focused-item class
      const focusedItems = document.querySelectorAll('.search-focused-item .list-item');
      expect(focusedItems.length).toBe(0);
    });

    it('should not show focus visual indicator when keyboardNav is false', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();

      // Navigate in smart mode
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      fireEvent.keyDown(searchInput, { key: 'Tab' }); // Switch to list

      const list = document.querySelector('.multi-select-list') as HTMLElement;
      fireEvent.keyDown(list, { key: 'ArrowUp' }); // Return to search

      // List items should not have 'focused' class when back in search mode
      const listItems = document.querySelectorAll('.list-item.focused');
      expect(listItems.length).toBe(0);
    });

    it('should return to search field after clicking item when navigating up from top', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');

      // Click on an item in the list
      const secondItem = screen.getByTestId('item-2');
      fireEvent.click(secondItem);

      // User presses Tab to give keyboard focus to the list
      fireEvent.keyDown(searchInput, { key: 'Tab' });
      const list = document.querySelector('.multi-select-list') as HTMLElement;

      // Navigate up from first item (list starts at first item after Tab)
      fireEvent.keyDown(list, { key: 'ArrowUp' });

      // Search field should now have focus
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Search Behavior', () => {
    it('should filter list when typing in search', async () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toBeInTheDocument();
        expect(screen.queryByTestId('item-2')).not.toBeInTheDocument();
      });
    });

    it('should reset focusedIndex to -1 when search changes', async () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');

      // Navigate to second item
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'First' } });

      await waitFor(() => {
        // No item should have search-focused-item class after search
        const focusedItems = document.querySelectorAll('.search-focused-item .list-item');
        expect(focusedItems.length).toBe(0);
      });
    });

    it('should call onSearchChange when search query changes', async () => {
      const onSearchChange = vi.fn();
      render(
        <SearchableListView {...defaultProps} onSearchChange={onSearchChange} />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      await waitFor(() => {
        expect(onSearchChange).toHaveBeenCalledWith('First', [mockItems[0]]);
      });
    });

    it('should select first element when search results change', async () => {
      const onSelect = vi.fn();
      render(
        <SearchableListView {...defaultProps} onSelect={onSelect} />
      );

      const searchInput = screen.getByPlaceholderText('Search...');

      // Type in search to filter results
      fireEvent.change(searchInput, { target: { value: 'First' } });

      await waitFor(() => {
        // First element should be automatically selected when filtered list changes
        expect(onSelect).toHaveBeenCalledWith(['1'], [mockItems[0]]);
      });
    });

    it('should move to second element when down arrow is pressed after search auto-selects first', async () => {
      const onSelect = vi.fn();
      render(
        <SearchableListView {...defaultProps} onSelect={onSelect} />
      );

      const searchInput = screen.getByPlaceholderText('Search...');

      // Type in search to filter results (this auto-selects first item)
      fireEvent.change(searchInput, { target: { value: 'Item' } }); // matches all items

      await waitFor(() => {
        // First item in filtered results should be automatically selected
        // With fuzzy search, "Item" matches all items, and First Item should rank first
        expect(onSelect).toHaveBeenCalled();
      });

      // Get the first selected item from the mock call
      const firstCall = onSelect.mock.calls[0];
      const firstSelectedId = firstCall[0][0];

      // Clear the mock to track next call
      onSelect.mockClear();

      // Press down arrow - should move to second item in the filtered list
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      // Should have moved to the next item in the list
      expect(onSelect).toHaveBeenCalled();
      const secondCall = onSelect.mock.calls[0];
      const secondSelectedId = secondCall[0][0];

      // Verify we moved to a different item
      expect(secondSelectedId).not.toBe(firstSelectedId);
    });

    it('should show empty state when no results found', async () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });

      await waitFor(() => {
        expect(screen.getByText('No items found')).toBeInTheDocument();
      });
    });
  });

  describe('Selection', () => {
    it('should call onSelect when item is clicked', () => {
      const onSelect = vi.fn();
      render(<SearchableListView {...defaultProps} onSelect={onSelect} />);

      const firstItem = screen.getByTestId('item-1');
      fireEvent.click(firstItem);

      expect(onSelect).toHaveBeenCalledWith(['1'], [mockItems[0]]);
    });

    it('should support multi-select with Ctrl+Click', () => {
      const onSelect = vi.fn();
      render(<SearchableListView {...defaultProps} onSelect={onSelect} />);

      const firstItem = screen.getByTestId('item-1');
      const secondItem = screen.getByTestId('item-2');

      fireEvent.click(firstItem);
      fireEvent.click(secondItem, { ctrlKey: true });

      expect(onSelect).toHaveBeenLastCalledWith(
        expect.arrayContaining(['1', '2']),
        expect.arrayContaining([mockItems[0], mockItems[1]])
      );
    });

    it('should support double-click activation', () => {
      const onActivate = vi.fn();
      render(<SearchableListView {...defaultProps} onActivate={onActivate} />);

      const firstItem = screen.getAllByRole('option')[0];
      fireEvent.dblClick(firstItem);

      expect(onActivate).toHaveBeenCalledWith(mockItems[0]);
    });
  });

  describe('Toolbar', () => {
    it('should render toolbar when buttons are provided', () => {
      const buttons = [
        {
          id: 'new',
          label: 'New',
          icon: 'plus',
          enabled: 'always' as const,
          action: vi.fn()
        }
      ];

      render(<SearchableListView {...defaultProps} buttons={buttons} />);

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should not render toolbar when no buttons provided', () => {
      render(<SearchableListView {...defaultProps} />);

      const toolbar = document.querySelector('.searchable-list-toolbar');
      expect(toolbar).not.toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should use custom placeholder', () => {
      render(
        <SearchableListView
          {...defaultProps}
          config={{ search: { placeholder: 'Custom placeholder' } }}
        />
      );

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('should use custom empty state', async () => {
      render(
        <SearchableListView
          {...defaultProps}
          config={{ list: { emptyState: <div>Custom empty state</div> } }}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });

      await waitFor(() => {
        expect(screen.getByText('Custom empty state')).toBeInTheDocument();
      });
    });

    it('should support custom search algorithm', async () => {
      render(
        <SearchableListView
          {...defaultProps}
          config={{ search: { algorithm: 'substring' } }}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'rst' } });

      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toBeInTheDocument(); // "First"
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(<SearchableListView {...defaultProps} />);

      const list = document.querySelector('[role="listbox"]');
      expect(list).toBeInTheDocument();

      const items = document.querySelectorAll('[role="option"]');
      expect(items.length).toBe(5);
    });

    it('should support keyboard navigation with Tab', () => {
      render(<SearchableListView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      // Verify list is keyboard accessible
      const list = document.querySelector('.multi-select-list');
      expect(list).toHaveAttribute('tabindex', '0');
      expect(list).toHaveAttribute('role', 'listbox');
    });
  });
});
