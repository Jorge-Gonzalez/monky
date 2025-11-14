/**
 * Coordination Hook for SearchableListView
 *
 * This hook encapsulates the coordination logic between FuzzySearchField,
 * MultiSelectList, and ActionToolbar components. It implements a state machine
 * pattern to manage the different interaction modes and their transitions.
 *
 * This is a Layer 2 pattern - it coordinates Layer 1 primitives without
 * knowing about domain-specific data.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Navigation modes for the search list
 */
export type NavigationMode =
  | 'idle'              // No interaction yet
  | 'searching'         // User is in search field, no visual focus on list
  | 'navigating'        // User navigating list from search field (smart mode)
  | 'listFocused';      // List has keyboard focus (traditional mode)

/**
 * Coordination state
 */
export interface CoordinationState<T> {
  mode: NavigationMode;
  focusedIndex: number;        // -1 means no visual focus
  selectedKeys: (string | number)[];
  selectedItems: T[];
  filteredItems: T[];
}

/**
 * Configuration for the coordination hook
 */
export interface CoordinationConfig<T> {
  items: T[];
  itemKey: string | ((item: T) => string | number);
  smartNavigation?: boolean;
  wrapNavigation?: boolean;
  onSelect?: (keys: (string | number)[], items: T[]) => void;
  onActivate?: (item: T) => void;
  onSearchChange?: (query: string, results: T[]) => void;
}

/**
 * Returns from the coordination hook
 */
export interface CoordinationAPI<T> {
  // State
  state: CoordinationState<T>;

  // Refs for child components
  listRef: React.RefObject<HTMLDivElement>;

  // Event handlers
  handlers: {
    // Search events
    onSearch: (query: string, results: T[]) => void;

    // List events
    onListSelect: (keys: (string | number)[], items: T[]) => void;
    onListFocus: () => void;
    onNavigationEscape: () => void;

    // Keyboard events (smart mode)
    onContainerKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  };

  // Utilities
  getItemKey: (item: T) => string | number;
}

/**
 * Hook that coordinates search, list, and toolbar interactions
 */
export function useSearchListCoordination<T>({
  items,
  itemKey,
  smartNavigation = true,
  wrapNavigation = true,
  onSelect,
  onActivate,
  onSearchChange
}: CoordinationConfig<T>): CoordinationAPI<T> {

  // ============================================================================
  // STATE
  // ============================================================================

  const [state, setState] = useState<CoordinationState<T>>({
    mode: 'idle',
    focusedIndex: -1,
    selectedKeys: [],
    selectedItems: [],
    filteredItems: items
  });

  // Refs for component coordination
  const listRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const getItemKey = useCallback((item: T): string | number => {
    if (typeof itemKey === 'function') {
      return itemKey(item);
    }
    return item[itemKey] as string | number;
  }, [itemKey]);

  // ============================================================================
  // UTILITIES FOR FOCUS MANAGEMENT
  // ============================================================================

  /**
   * Helper to focus the search input (since we can't use ref on FuzzySearchField)
   */
  const focusSearchInput = useCallback(() => {
    const searchInput = document.querySelector('.searchable-list-search input') as HTMLInputElement;
    searchInput?.focus();
  }, []);

  /**
   * Helper to check if search input is focused
   */
  const isSearchInputFocused = useCallback(() => {
    const searchInput = document.querySelector('.searchable-list-search input') as HTMLInputElement;
    return document.activeElement === searchInput;
  }, []);

  // ============================================================================
  // COORDINATION RULES
  // ============================================================================

  /**
   * Rule: When search results change, auto-select first item
   */
  const handleSearch = useCallback((query: string, results: T[]) => {
    setState(prev => {
      // If there's a query and results, select first item
      if (query && results.length > 0) {
        const firstItem = results[0];
        const firstKey = getItemKey(firstItem);
        const newState: CoordinationState<T> = {
          mode: 'navigating',
          focusedIndex: 0,
          selectedKeys: [firstKey],
          selectedItems: [firstItem],
          filteredItems: results
        };

        // Notify parent of selection change
        if (onSelect) {
          onSelect([firstKey], [firstItem]);
        }

        return newState;
      }

      // No query or no results - reset
      return {
        ...prev,
        mode: 'idle',
        focusedIndex: -1,
        selectedKeys: [],
        selectedItems: [],
        filteredItems: results
      };
    });

    // Notify parent of search change
    if (onSearchChange) {
      onSearchChange(query, results);
    }
  }, [getItemKey, onSelect, onSearchChange]);

  /**
   * Rule: When list selection changes (from clicks, etc.)
   */
  const handleListSelect = useCallback((keys: (string | number)[], items: T[]) => {
    setState(prev => ({
      ...prev,
      selectedKeys: keys,
      selectedItems: items
    }));

    if (onSelect) {
      onSelect(keys, items);
    }
  }, [onSelect]);

  /**
   * Rule: When list gains focus (Tab or click)
   */
  const handleListFocus = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'listFocused'
    }));
  }, []);

  /**
   * Rule: When navigating up from first item in list mode
   */
  const handleNavigationEscape = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'searching',
      focusedIndex: -1
    }));
    focusSearchInput();
  }, [focusSearchInput]);

  /**
   * Rule: Smart keyboard navigation (search field focused but controls list)
   */
  const handleContainerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const activeElement = document.activeElement;
    const isSearchActive = isSearchInputFocused();
    const isListActive = listRef.current?.contains(activeElement as Node);

    // If list has focus, let it handle its own navigation
    if (isListActive && state.mode === 'listFocused') {
      return;
    }

    // Smart mode: Search is focused but controls list visually
    if (!smartNavigation || !isSearchActive) {
      return;
    }

    const { filteredItems, focusedIndex } = state;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (filteredItems.length > 0) {
          setState(prev => {
            let newIndex: number;

            if (prev.focusedIndex === -1) {
              newIndex = 0;
            } else {
              const nextIndex = prev.focusedIndex + 1;
              newIndex = nextIndex >= filteredItems.length
                ? (wrapNavigation ? 0 : prev.focusedIndex)
                : nextIndex;
            }

            if (newIndex !== prev.focusedIndex) {
              const item = filteredItems[newIndex];
              const key = getItemKey(item);

              // Update selection
              if (onSelect) {
                onSelect([key], [item]);
              }

              return {
                ...prev,
                mode: 'navigating',
                focusedIndex: newIndex,
                selectedKeys: [key],
                selectedItems: [item]
              };
            }

            return prev;
          });
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (filteredItems.length > 0) {
          setState(prev => {
            // No item focused yet - start at first
            if (prev.focusedIndex === -1) {
              const item = filteredItems[0];
              const key = getItemKey(item);

              if (onSelect) {
                onSelect([key], [item]);
              }

              return {
                ...prev,
                mode: 'navigating',
                focusedIndex: 0,
                selectedKeys: [key],
                selectedItems: [item]
              };
            }

            // At top - clear visual focus but keep selection
            if (prev.focusedIndex === 0) {
              return {
                ...prev,
                mode: 'searching',
                focusedIndex: -1
                // Keep selectedKeys and selectedItems
              };
            }

            // Navigate up
            const newIndex = prev.focusedIndex - 1;
            const item = filteredItems[newIndex];
            const key = getItemKey(item);

            if (onSelect) {
              onSelect([key], [item]);
            }

            return {
              ...prev,
              focusedIndex: newIndex,
              selectedKeys: [key],
              selectedItems: [item]
            };
          });
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredItems[focusedIndex] && onActivate) {
          onActivate(filteredItems[focusedIndex]);
        }
        break;

      case 'Tab':
        e.preventDefault();
        setState(prev => ({
          ...prev,
          mode: 'listFocused'
        }));
        listRef.current?.focus();
        break;
    }
  }, [state, smartNavigation, wrapNavigation, getItemKey, onSelect, onActivate]);

  // ============================================================================
  // SIDE EFFECTS
  // ============================================================================

  /**
   * Scroll focused item into view when navigating in smart mode
   */
  useEffect(() => {
    if (smartNavigation && state.mode === 'searching' && state.focusedIndex >= 0) {
      const focusedElement = listRef.current?.querySelector(`[id="item-${state.focusedIndex}"]`);
      focusedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [smartNavigation, state.mode, state.focusedIndex]);

  // ============================================================================
  // API
  // ============================================================================

  return {
    state,
    listRef,
    handlers: {
      onSearch: handleSearch,
      onListSelect: handleListSelect,
      onListFocus: handleListFocus,
      onNavigationEscape: handleNavigationEscape,
      onContainerKeyDown: handleContainerKeyDown
    },
    getItemKey
  };
}
