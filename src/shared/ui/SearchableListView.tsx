/**
 * SearchableListView - Layer 2 Coordinator Component
 *
 * This component demonstrates the 3-layer architecture pattern:
 * - Layer 1: Primitives (MultiSelectList, FuzzySearchField, ActionToolbar)
 * - Layer 2: THIS - Coordinator that expresses component interactions
 * - Layer 3: Domain-specific usage (MacroListView, etc.)
 *
 * The coordination logic lives in useSearchListCoordination hook, making this
 * component a thin, declarative presentation of how components work together.
 */

import React, { useMemo } from 'react';
import { MultiSelectList, SelectionConfig } from './MultiSelectList';
import { FuzzySearchField, SearchAlgorithm } from './FuzzySearchField';
import { ActionToolbar, ToolbarButton, ToolbarPosition } from './ActionToolbar';
import { useSearchListCoordination } from './useSearchListCoordination';

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
 * SearchableListView - Thin coordinator component
 *
 * This component demonstrates good Layer 2 design:
 * - Minimal state (all in coordination hook)
 * - Clear component composition
 * - Explicit data flow through coordination API
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

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  const {
    algorithm = 'fuzzy',
    debounce = 200,
    minChars = 0,
    placeholder = 'Search...',
    clearButton = true
  } = config.search || {};

  const {
    emptyState = <div className="empty-state padding-lg ink-soft font-md">No items found</div>,
    selectionConfig = { mode: 'single', toggleOnClick: true }
  } = config.list || {};

  const {
    position = 'footer',
    enableShortcuts = true
  } = config.toolbar || {};

  const {
    focusOnMount = true,
    wrapNavigation = true,
    smartNavigation = true
  } = config.keyboard || {};

  // ============================================================================
  // COORDINATION HOOK
  // All complex state management and interaction logic lives here
  // ============================================================================

  const coordination = useSearchListCoordination({
    items,
    itemKey,
    smartNavigation,
    wrapNavigation,
    onSelect,
    onActivate,
    onSearchChange
  });

  const { state, listRef, handlers } = coordination;

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  // Enhance renderItem to include visual focus indicator (smart mode)
  const enhancedRenderItem = useMemo(() => {
    return (item: T, index: number) => {
      const isSmartFocused = smartNavigation &&
                            state.mode === 'searching' &&
                            state.focusedIndex === index;
      const isNavigating = state.mode === 'navigating' && state.focusedIndex === index;

      const content = renderItem(item, index);

      // Wrap with focus indicator if needed
      if (isSmartFocused || isNavigating) {
        return <div className="search-focused-item">{content}</div>;
      }

      return <div className="">{content}</div>;
    };
  }, [renderItem, smartNavigation, state.mode, state.focusedIndex]);

  // ============================================================================
  // RENDER - Pure presentation, no logic
  // ============================================================================

  return (
    <div
      className={`searchable-list-view ${className}`}
      onKeyDown={handlers.onContainerKeyDown}
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
          onSearch={handlers.onSearch}
          className="search-field"
        />
      </div>

      {/* List */}
      <div
        className="searchable-list-container"
        ref={listRef}
        onFocus={handlers.onListFocus}
      >
        <MultiSelectList
          items={state.filteredItems}
          itemKey={itemKey}
          renderItem={enhancedRenderItem}
          emptyState={emptyState}
          selectionConfig={selectionConfig}
          selection={state.selectedKeys}
          keyboardNav={!smartNavigation || state.mode === 'listFocused'}
          onSelect={handlers.onListSelect}
          onActivate={onActivate}
          onNavigationEscape={smartNavigation ? handlers.onNavigationEscape : undefined}
          className="list"
        />
      </div>

      {/* Toolbar */}
      {buttons.length > 0 && (
        <div className="searchable-list-toolbar">
          <ActionToolbar
            buttons={buttons}
            position={position}
            selectionCount={state.selectedItems.length}
            selectedItems={state.selectedItems}
            enableShortcuts={enableShortcuts}
            className="toolbar"
          />
        </div>
      )}
    </div>
  );
}
