import React, { useState, useEffect, useRef, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import fuzzysort from 'fuzzysort';

/**
 * Search algorithm types
 */
export type SearchAlgorithm = 'fuzzy' | 'substring' | 'startsWith';

/**
 * Data source: static array or async function
 */
export type DataSource<T> = T[] | ((query: string) => Promise<T[]>);

/**
 * Props for FuzzySearchField component
 */
export interface FuzzySearchFieldProps<T> {
  /** Keys to search within items (property names) */
  searchKeys: (keyof T)[];

  /** Search algorithm to use */
  algorithm?: SearchAlgorithm;

  /** Debounce delay in milliseconds */
  debounce?: number;

  /** Minimum characters before searching */
  minChars?: number;

  /** Placeholder text */
  placeholder?: string;

  /** Show clear button */
  clearButton?: boolean;

  /** CSS class name */
  className?: string;

  /** Data source (static or async) */
  dataSource?: DataSource<T>;

  /** Auto-focus on mount */
  autoFocus?: boolean;

  // Events
  /** Called when search results are ready */
  onSearch?: (query: string, results: T[]) => void;

  /** Called when search is cleared */
  onClear?: () => void;

  /** Called when user presses ArrowDown (to move focus to list) */
  onNavigateDown?: () => void;

  /** Called when query changes (before debounce) */
  onQueryChange?: (query: string) => void;
}

/**
 * FuzzySearchField - Generic search input with filtering
 *
 * Features:
 * - Fuzzy search using fuzzysort library
 * - Multiple search algorithms
 * - Debounced input
 * - Async data source support
 * - Keyboard navigation integration
 * - Clear button
 */
export function FuzzySearchField<T>({
  searchKeys,
  algorithm = 'fuzzy',
  debounce: debounceMs = 150,
  minChars = 0,
  placeholder = 'Search...',
  clearButton = true,
  className = '',
  dataSource,
  autoFocus = false,
  onSearch,
  onClear,
  onNavigateDown,
  onQueryChange
}: FuzzySearchFieldProps<T>) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minChars) {
      // Below minimum chars - return empty or all items
      if (onSearch) {
        const allItems = Array.isArray(dataSource) ? dataSource : [];
        onSearch(searchQuery, allItems);
      }
      return;
    }

    setIsSearching(true);

    try {
      // Get data
      let items: T[];
      if (typeof dataSource === 'function') {
        items = await dataSource(searchQuery);
      } else if (Array.isArray(dataSource)) {
        items = dataSource;
      } else {
        items = [];
      }

      // Filter based on algorithm
      let results: T[];

      if (searchQuery.length === 0) {
        results = items;
      } else {
        switch (algorithm) {
          case 'fuzzy':
            results = fuzzySearch(items, searchQuery, searchKeys);
            break;

          case 'substring':
            results = substringSearch(items, searchQuery, searchKeys);
            break;

          case 'startsWith':
            results = startsWithSearch(items, searchQuery, searchKeys);
            break;

          default:
            results = items;
        }
      }

      if (onSearch) {
        onSearch(searchQuery, results);
      }
    } finally {
      setIsSearching(false);
    }
  }, [algorithm, dataSource, minChars, onSearch, searchKeys]);

  // Fuzzy search implementation
  const fuzzySearch = useCallback((items: T[], query: string, keys: (keyof T)[]): T[] => {
    // Prepare search targets
    const prepared = items.map(item => {
      const searchableText = keys
        .map(key => String(item[key] || ''))
        .join(' ');
      return {
        item,
        target: searchableText
      };
    });

    // Use fuzzysort
    const results = fuzzysort.go(query, prepared, {
      key: 'target',
      threshold: -10000 // Accept all matches, sorted by score
    });

    return results.map(result => result.obj.item);
  }, []);

  // Substring search implementation
  const substringSearch = useCallback((items: T[], query: string, keys: (keyof T)[]): T[] => {
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      keys.some(key =>
        String(item[key] || '').toLowerCase().includes(lowerQuery)
      )
    );
  }, []);

  // Starts-with search implementation
  const startsWithSearch = useCallback((items: T[], query: string, keys: (keyof T)[]): T[] => {
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      keys.some(key =>
        String(item[key] || '').toLowerCase().startsWith(lowerQuery)
      )
    );
  }, []);

  // Handle input change
  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);

    if (onQueryChange) {
      onQueryChange(newQuery);
    }

    // Debounce search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, debounceMs);
  }, [debounceMs, onQueryChange, performSearch]);

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSearch('');
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  }, [onClear, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && onNavigateDown) {
      event.preventDefault();
      onNavigateDown();
    } else if (event.key === 'Escape') {
      if (query) {
        handleClear();
      }
    }
  }, [onNavigateDown, query, handleClear]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Initial search
  useEffect(() => {
    performSearch('');
  }, [performSearch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`fuzzy-search-field ${className}`} role="search">
      <div>
        <input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          aria-label={placeholder}
          autoComplete="off"
        />
        {clearButton && query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        {isSearching && (
          <div aria-label="Searching...">
            ⏳
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to focus the search field from external components
 */
export function useFuzzySearchFocus() {
  const focusRef = useRef<HTMLInputElement>(null);

  const focus = useCallback(() => {
    focusRef.current?.focus();
  }, []);

  return { focusRef, focus };
}
