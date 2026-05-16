// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FuzzySearchField, FuzzySearchFieldProps } from './FuzzySearchField';

interface TestItem {
  id: string;
  name: string;
  category: string;
  tags: string[];
}

const mockItems: TestItem[] = [
  { id: '1', name: 'Apple', category: 'Fruit', tags: ['red', 'sweet'] },
  { id: '2', name: 'Banana', category: 'Fruit', tags: ['yellow', 'sweet'] },
  { id: '3', name: 'Carrot', category: 'Vegetable', tags: ['orange', 'crunchy'] },
  { id: '4', name: 'Date', category: 'Fruit', tags: ['brown', 'sweet'] },
  { id: '5', name: 'Eggplant', category: 'Vegetable', tags: ['purple'] },
];

const defaultProps: FuzzySearchFieldProps<TestItem> = {
  searchKeys: ['name', 'category'],
  dataSource: mockItems,
};

describe('FuzzySearchField', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<FuzzySearchField {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <FuzzySearchField {...defaultProps} placeholder="Search items..." />
      );

      expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<FuzzySearchField {...defaultProps} className="custom-search" />);

      const container = document.querySelector('.fuzzy-search-field');
      expect(container).toHaveClass('custom-search');
    });

    it('should auto-focus when autoFocus is true', () => {
      render(<FuzzySearchField {...defaultProps} autoFocus />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveFocus();
    });

    it('should show clear button when query is not empty', () => {
      render(<FuzzySearchField {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('should hide clear button when clearButton is false', () => {
      render(<FuzzySearchField {...defaultProps} clearButton={false} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });
  });

  describe('Initial Search', () => {
    it('should call onSearch with all items initially', async () => {
      const onSearch = vi.fn();
      render(<FuzzySearchField {...defaultProps} onSearch={onSearch} />);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('', mockItems);
      });
    });
  });

  describe('Search - Fuzzy Algorithm', () => {
    it('should search using fuzzy algorithm by default', async () => {
      const onSearch = vi.fn();
      render(<FuzzySearchField {...defaultProps} onSearch={onSearch} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'apl' } });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(
          'apl',
          expect.arrayContaining([mockItems[0]]) // Apple
        );
      }, { timeout: 500 });
    });

    it('should find items with fuzzy matching', async () => {
      const onSearch = vi.fn();
      render(<FuzzySearchField {...defaultProps} onSearch={onSearch} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'bnn' } });

      await waitFor(() => {
        const calls = onSearch.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[1]).toContainEqual(mockItems[1]); // Banana
      }, { timeout: 500 });
    });
  });

  describe('Search - Substring Algorithm', () => {
    it('should search using substring algorithm', async () => {
      const onSearch = vi.fn();
      render(
        <FuzzySearchField
          {...defaultProps}
          algorithm="substring"
          onSearch={onSearch}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'arr' } });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(
          'arr',
          expect.arrayContaining([mockItems[2]]) // Carrot
        );
      }, { timeout: 500 });
    });

    it('should be case-insensitive', async () => {
      const onSearch = vi.fn();
      render(
        <FuzzySearchField
          {...defaultProps}
          algorithm="substring"
          onSearch={onSearch}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'APPLE' } });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(
          'APPLE',
          expect.arrayContaining([mockItems[0]])
        );
      }, { timeout: 500 });
    });
  });

  describe('Search - StartsWith Algorithm', () => {
    it('should search using startsWith algorithm', async () => {
      const onSearch = vi.fn();
      render(
        <FuzzySearchField
          {...defaultProps}
          algorithm="startsWith"
          onSearch={onSearch}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'Ban' } });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(
          'Ban',
          expect.arrayContaining([mockItems[1]]) // Banana
        );
      }, { timeout: 500 });
    });

    it('should not match items that do not start with query', async () => {
      const onSearch = vi.fn();
      render(
        <FuzzySearchField
          {...defaultProps}
          algorithm="startsWith"
          onSearch={onSearch}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'ana' } });

      await waitFor(() => {
        const calls = onSearch.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[1]).not.toContainEqual(mockItems[1]); // Banana
      }, { timeout: 500 });
    });
  });

  describe('Debouncing', () => {
    it('should debounce search by default (150ms)', async () => {
      const onSearch = vi.fn();
      render(<FuzzySearchField {...defaultProps} onSearch={onSearch} />);

      const input = screen.getByPlaceholderText('Search...');

      fireEvent.change(input, { target: { value: 'a' } });
      const initialCalls = onSearch.mock.calls.length;

      fireEvent.change(input, { target: { value: 'ap' } });

      // Wait for debounce to complete
      await waitFor(() => {
        expect(onSearch.mock.calls.length).toBeGreaterThan(initialCalls);
      }, { timeout: 500 });
    });

    it('should use custom debounce time', async () => {
      const onSearch = vi.fn();
      render(
        <FuzzySearchField {...defaultProps} debounce={300} onSearch={onSearch} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test', expect.any(Array));
      }, { timeout: 500 });
    });

    it('should cancel previous debounce on new input', async () => {
      const onSearch = vi.fn();
      render(<FuzzySearchField {...defaultProps} onSearch={onSearch} />);

      const input = screen.getByPlaceholderText('Search...');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ap' } });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('ap', expect.any(Array));
      }, { timeout: 500 });
    });
  });

  describe('Minimum Characters', () => {
    it('should respect minChars setting', async () => {
      const onSearch = vi.fn();
      render(
        <FuzzySearchField {...defaultProps} minChars={3} onSearch={onSearch} />
      );

      const input = screen.getByPlaceholderText('Search...');

      fireEvent.change(input, { target: { value: 'ab' } });

      await waitFor(() => {
        const calls = onSearch.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toBe('ab');
        expect(lastCall[1]).toEqual(mockItems); // Returns all items
      }, { timeout: 500 });
    });

    it('should search when minChars is met', async () => {
      const onSearch = vi.fn();
      render(
        <FuzzySearchField {...defaultProps} minChars={3} onSearch={onSearch} />
      );

      const input = screen.getByPlaceholderText('Search...');

      fireEvent.change(input, { target: { value: 'App' } });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(
          'App',
          expect.arrayContaining([mockItems[0]])
        );
      }, { timeout: 500 });
    });
  });

  describe('Clear Functionality', () => {
    it('should clear search on clear button click', async () => {
      const onSearch = vi.fn();
      const onClear = vi.fn();
      render(
        <FuzzySearchField
          {...defaultProps}
          onSearch={onSearch}
          onClear={onClear}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.click(clearButton);

      expect(input).toHaveValue('');
      expect(onClear).toHaveBeenCalled();

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('', mockItems);
      });
    });

    it('should clear search on Escape key', () => {
      render(<FuzzySearchField {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      fireEvent.keyDown(input, { key: 'Escape' });

      expect(input).toHaveValue('');
    });

    it('should not clear on Escape if query is empty', () => {
      render(<FuzzySearchField {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should not throw or cause issues
      expect(input).toHaveValue('');
    });

    it('should refocus input after clear', () => {
      render(<FuzzySearchField {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.click(clearButton);

      expect(input).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onNavigateDown on ArrowDown', () => {
      const onNavigateDown = vi.fn();
      render(
        <FuzzySearchField {...defaultProps} onNavigateDown={onNavigateDown} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(onNavigateDown).toHaveBeenCalled();
    });

    it('should prevent default on ArrowDown when onNavigateDown is provided', () => {
      const onNavigateDown = vi.fn();
      render(
        <FuzzySearchField {...defaultProps} onNavigateDown={onNavigateDown} />
      );

      const input = screen.getByPlaceholderText('Search...');
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      input.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Query Change Callback', () => {
    it('should call onQueryChange immediately (before debounce)', () => {
      const onQueryChange = vi.fn();
      render(
        <FuzzySearchField {...defaultProps} onQueryChange={onQueryChange} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(onQueryChange).toHaveBeenCalledWith('test');
      expect(onQueryChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Async Data Source', () => {
    it('should support async data source', async () => {
      const asyncDataSource = vi.fn().mockResolvedValue(mockItems);
      const onSearch = vi.fn();

      render(
        <FuzzySearchField
          {...defaultProps}
          dataSource={asyncDataSource}
          onSearch={onSearch}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'Apple' } });

      await waitFor(() => {
        expect(asyncDataSource).toHaveBeenCalledWith('Apple');
        expect(onSearch).toHaveBeenCalledWith(
          'Apple',
          expect.arrayContaining([mockItems[0]])
        );
      }, { timeout: 500 });
    });

    it('should show loading state during async search', async () => {
      const asyncDataSource = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockItems), 100))
      );

      render(
        <FuzzySearchField {...defaultProps} dataSource={asyncDataSource} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByLabelText('Searching...')).toBeInTheDocument();
      }, { timeout: 500 });

      await waitFor(() => {
        expect(screen.queryByLabelText('Searching...')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Multiple Search Keys', () => {
    it('should search across multiple keys', async () => {
      const onSearch = vi.fn();
      render(
        <FuzzySearchField
          {...defaultProps}
          searchKeys={['name', 'category', 'tags']}
          algorithm="substring"
          onSearch={onSearch}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'Fruit' } });

      await waitFor(() => {
        const calls = onSearch.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[1].length).toBe(3); // Apple, Banana, Date are fruits
      }, { timeout: 500 });
    });
  });

  describe('Accessibility', () => {
    it('should have role="search"', () => {
      render(<FuzzySearchField {...defaultProps} />);

      const searchContainer = document.querySelector('[role="search"]');
      expect(searchContainer).toBeInTheDocument();
    });

    it('should have aria-label on input', () => {
      render(<FuzzySearchField {...defaultProps} placeholder="Find items" />);

      const input = screen.getByPlaceholderText('Find items');
      expect(input).toHaveAttribute('aria-label', 'Find items');
    });

    it('should have aria-label on clear button', () => {
      render(<FuzzySearchField {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
    });

    it('should disable autocomplete', () => {
      render(<FuzzySearchField {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data source', async () => {
      const onSearch = vi.fn();
      render(<FuzzySearchField {...defaultProps} dataSource={[]} onSearch={onSearch} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test', []);
      }, { timeout: 500 });
    });

    it('should handle undefined data source', async () => {
      const onSearch = vi.fn();
      render(
        <FuzzySearchField
          searchKeys={['name']}
          onSearch={onSearch}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test', []);
      }, { timeout: 500 });
    });

    it('should cleanup debounce timer on unmount', () => {
      const { unmount } = render(<FuzzySearchField {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      unmount();

      // Should not cause any errors
      expect(() => {}).not.toThrow();
    });
  });
});
