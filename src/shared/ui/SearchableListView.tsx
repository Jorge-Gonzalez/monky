/**
 * SearchableListView - Composed infrastructure component
 *
 * Coordinates MultiSelectList, FuzzySearchField, and ActionToolbar
 * with smart keyboard navigation. Remains domain-agnostic.
 *
 * Keyboard Smart Mode (Context-aware) - enabled by default:
 * - Search field starts focused
 * - Arrow keys navigate list visually without losing search focus
 * - Enter activates the highlighted item
 * - Tab switches between search and list
 * - Up from first item stays at first item (no wrap)
 *
 * Traditional Mode (smartNavigation: false):
 * - Arrow keys only work when list has focus
 * - Use Tab to switch focus from search to list
 * - Navigation wraps around (up from first goes to last)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MultiSelectList, MultiSelectListProps, SelectionConfig } from './MultiSelectList';
import { FuzzySearchField, SearchAlgorithm, DataSource } from './FuzzySearchField';
import { ActionToolbar, ToolbarButton, ToolbarPosition } from './ActionToolbar';

/**
 * Configuration for SearchableListView behavior
 */
export interface SearchableListConfig {
  /** Search configuration */
  search?: {
    algorithm?: SearchAlgorithm;
    debounce?: number;
    minChars?: number;
    placeholder?: string;
    clearButton?: boolean;
  };

  /** List configuration */
  list?: {
    emptyState?: React.ReactNode;
    selectionConfig?: SelectionConfig;
  };

  /** Toolbar configuration */
  toolbar?: {
    position?: ToolbarPosition;
    enableShortcuts?: boolean;
  };

  /** Keyboard behavior */
  keyboard?: {
    /** Focus search field on mount */
    focusOnMount?: boolean;
    /** Wrap navigation from bottom to top */
    wrapNavigation?: boolean;
    /** Enable smart navigation (arrow keys work from search field) */
    smartNavigation?: boolean;
  };
}

/**
 * Props for SearchableListView component
 */
export interface SearchableListViewProps<T> {
  /** Array of items to display */
  items: T[];

  /** Property name or function to extract unique key from item */
  itemKey: keyof T | ((item: T) => string | number);

  /** Keys to search within items */
  searchKeys: (keyof T)[];

  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;

  /** Toolbar buttons configuration */
  buttons?: ToolbarButton<T>[];

  /** Configuration object */
  config?: SearchableListConfig;

  /** CSS class name for the container */
  className?: string;

  // Events
  /** Called when selection changes */
  onSelect?: (selectedKeys: (string | number)[], selectedItems: T[]) => void;

  /** Called when item is activated (Enter or double-click) */
  onActivate?: (item: T) => void;

  /** Called when search query changes */
  onSearchChange?: (query: string, results: T[]) => void;
}

/**
 * SearchableListView - Composed infrastructure component
 *
 * Provides a complete search + list + toolbar experience with
 * smart keyboard navigation while remaining domain-agnostic.
 */
export function SearchableListView<T>({
  items,
  itemKey,
  searchKeys,
  renderItem,
  buttons = [],
  config = {},
  className = '',
  onSelect,
  onActivate,
  onSearchChange
}: SearchableListViewProps<T>) {
  // Merge with defaults
  const {
    search: searchConfig = {},
    list: listConfig = {},
    toolbar: toolbarConfig = {},
    keyboard: keyboardConfig = {}
  } = config;

  const {
    algorithm = 'fuzzy',
    debounce = 150,
    minChars = 0,
    placeholder = 'Search...',
    clearButton = true
  } = searchConfig;

  const {
    emptyState = 'No items found',
    selectionConfig = { multiSelect: true, wrapNavigation: true }
  } = listConfig;

  const {
    position = 'footer',
    enableShortcuts = true
  } = toolbarConfig;

  const {
    focusOnMount = true,
    wrapNavigation = true,
    smartNavigation = true
  } = keyboardConfig;

  // State
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1); // -1 means no item focused yet
  const [currentFocus, setCurrentFocus] = useState<'search' | 'list'>('search');

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Helper to get item key
  const getItemKey = useCallback((item: T): string | number => {
    if (typeof itemKey === 'function') {
      return itemKey(item);
    }
    return item[itemKey] as string | number;
  }, [itemKey]);

  // Handle search results
  const handleSearch = useCallback((query: string, results: T[]) => {
    setFilteredItems(results);

    // Auto-select first item when search results change (only if there's an actual query)
    if (query && results.length > 0) {
      const firstItem = results[0];
      const firstKey = getItemKey(firstItem);
      setSelectedKeys([firstKey]);
      setSelectedItems([firstItem]);
      setFocusedIndex(0); // Set focused index to first item since we're selecting it
      if (onSelect) {
        onSelect([firstKey], [firstItem]);
      }
    } else if (!query) {
      // Initial state or cleared search - reset selection
      setSelectedKeys([]);
      setSelectedItems([]);
      setFocusedIndex(-1); // Reset to no item focused
    } else {
      // Query exists but no results
      setSelectedKeys([]); // Reset selection when no results
      setSelectedItems([]); // Reset selected items when no results
      setFocusedIndex(-1); // Reset to no item focused when no results
    }

    if (onSearchChange) {
      onSearchChange(query, results);
    }
  }, [onSearchChange, getItemKey, onSelect]);

  // Handle selection changes from list
  const handleListSelect = useCallback((keys: (string | number)[], items: T[]) => {
    setSelectedKeys(keys);
    setSelectedItems(items);
    if (onSelect) {
      onSelect(keys, items);
    }
  }, [onSelect]);

  // Handle activation from list or keyboard
  const handleActivation = useCallback((item: T) => {
    if (onActivate) {
      onActivate(item);
    }
  }, [onActivate]);

  // Handle when user navigates up from first item in list
  const handleNavigationEscape = useCallback(() => {
    setCurrentFocus('search');
    setFocusedIndex(-1); // Reset to no item focused
    searchInputRef.current?.focus();
  }, []);

  // Smart keyboard handler for the container
  const handleContainerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Determine which component should handle the key
    const activeElement = document.activeElement;
    const isSearchActive = activeElement === searchInputRef.current;
    const isListActive = listRef.current?.contains(activeElement as Node);

    // If list has focus, let it handle its own navigation
    if (isListActive && currentFocus === 'list') {
      return;
    }

    // Smart mode: Search is focused but controls list visually (only if smartNavigation is enabled)
    if (smartNavigation && (isSearchActive || currentFocus === 'search')) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (filteredItems.length > 0) {
            let newIndex: number;
            // If no item focused yet, start at first item
            if (focusedIndex === -1) {
              newIndex = 0;
            } else {
              const nextIndex = focusedIndex + 1;
              if (nextIndex >= filteredItems.length) {
                newIndex = wrapNavigation ? 0 : focusedIndex;
              } else {
                newIndex = nextIndex;
              }
            }

            // Update focus and select the item
            if (newIndex !== focusedIndex) {
              setFocusedIndex(newIndex);
              const item = filteredItems[newIndex];
              const key = getItemKey(item);
              handleListSelect([key], [item]);
            }
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (filteredItems.length > 0) {
            // If no item focused yet, start at first item
            if (focusedIndex === -1) {
              setFocusedIndex(0);
              const item = filteredItems[0];
              const key = getItemKey(item);
              handleListSelect([key], [item]);
            } else if (focusedIndex === 0) {
              // Already at top - keep first item selected but clear visual focus
              // This allows the user to "escape" back to search while keeping the selection
              setFocusedIndex(-1);
              // Keep selection as is - don't clear selectedKeys/selectedItems
              // Search field already has focus in smart mode, just clear the visual focus indicator
            } else {
              // Navigate up
              const newIndex = focusedIndex - 1;
              setFocusedIndex(newIndex);
              const item = filteredItems[newIndex];
              const key = getItemKey(item);
              handleListSelect([key], [item]);
            }
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (filteredItems[focusedIndex]) {
            handleActivation(filteredItems[focusedIndex]);
          }
          break;

        case 'Tab':
          // Switch focus to list
          e.preventDefault();
          setCurrentFocus('list');
          listRef.current?.focus();
          break;
      }
    }
  }, [filteredItems, focusedIndex, currentFocus, handleActivation, wrapNavigation, smartNavigation, getItemKey, handleListSelect, onSelect]);

  // When user clicks in the list, update current focus
  const handleListFocus = useCallback(() => {
    setCurrentFocus('list');
  }, []);

  // Scroll focused item into view when navigating from search (smart mode only)
  useEffect(() => {
    if (smartNavigation && currentFocus === 'search' && filteredItems.length > 0 && focusedIndex >= 0) {
      // Find the focused item element and scroll it into view
      const listElement = listRef.current;
      if (listElement) {
        const itemElements = listElement.querySelectorAll('.list-item');
        const focusedElement = itemElements[focusedIndex] as HTMLElement;
        if (focusedElement) {
          focusedElement.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
          });
        }
      }
    }
  }, [focusedIndex, currentFocus, filteredItems.length, smartNavigation]);

  // Focus search on mount if configured
  useEffect(() => {
    if (focusOnMount) {
      searchInputRef.current?.focus();
    }
  }, [focusOnMount]);

  // Enhanced render item that adds focused state when navigating from search
  const enhancedRenderItem = useCallback((item: T, index: number) => {
    const isFocusedFromSearch = smartNavigation && currentFocus === 'search' && index === focusedIndex;
    return (
      <div className={isFocusedFromSearch ? 'search-focused-item' : ''}>
        {renderItem(item, index)}
      </div>
    );
  }, [renderItem, currentFocus, focusedIndex, smartNavigation]);

  return (
    <div
      ref={containerRef}
      className={`searchable-list-view ${className}`}
      onKeyDown={handleContainerKeyDown}
    >
      {/* Search Field */}
      <div className="searchable-list-search">
        <FuzzySearchField
          searchKeys={searchKeys}
          algorithm={algorithm}
          debounce={debounce}
          minChars={minChars}
          placeholder={placeholder}
          clearButton={clearButton}
          dataSource={items}
          autoFocus={focusOnMount}
          onSearch={handleSearch}
          className="search-field"
        />
      </div>

      {/* List */}
      <div
        className="searchable-list-container"
        ref={listRef}
        onFocus={handleListFocus}
      >
        <MultiSelectList
          items={filteredItems}
          itemKey={itemKey}
          renderItem={enhancedRenderItem}
          emptyState={emptyState}
          selectionConfig={selectionConfig}
          selection={selectedKeys}
          keyboardNav={!smartNavigation || currentFocus === 'list'}
          onSelect={handleListSelect}
          onActivate={handleActivation}
          onNavigationEscape={smartNavigation ? handleNavigationEscape : undefined}
          className="list"
        />
      </div>

      {/* Toolbar */}
      {buttons.length > 0 && (
        <div className="searchable-list-toolbar">
          <ActionToolbar
            buttons={buttons}
            position={position}
            selectionCount={selectedItems.length}
            selectedItems={selectedItems}
            enableShortcuts={enableShortcuts}
            className="toolbar"
          />
        </div>
      )}
    </div>
  );
}
