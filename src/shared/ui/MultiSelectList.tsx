import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';

/**
 * Configuration for how selection behaves
 */
export interface SelectionConfig {
  /** Allow multi-select with Ctrl+Click */
  multiSelect?: boolean;
  /** Wrap keyboard navigation from bottom to top */
  wrapNavigation?: boolean;
}

/**
 * Generic multi-select list component with keyboard navigation
 *
 * @template T - The type of items in the list
 */
export interface MultiSelectListProps<T> {
  /** Array of items to display */
  items: T[];

  /** Property name or function to extract unique key from item */
  itemKey: keyof T | ((item: T) => string | number);

  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;

  /** Empty state to show when no items */
  emptyState?: React.ReactNode;

  /** CSS class name for the container */
  className?: string;

  /** Selection configuration */
  selectionConfig?: SelectionConfig;

  /** Controlled selection state (array of keys) */
  selection?: (string | number)[];

  /** Enable keyboard navigation */
  keyboardNav?: boolean;

  // Events
  /** Called when selection changes */
  onSelect?: (selectedKeys: (string | number)[], selectedItems: T[]) => void;

  /** Called when item is activated (double-click or Enter) */
  onActivate?: (item: T) => void;

  /** Called when user navigates up from first item (to focus search) */
  onNavigationEscape?: () => void;

  /** Called when an item receives keyboard focus */
  onFocusItem?: (item: T, index: number) => void;
}

/**
 * MultiSelectList - Generic list component with selection and keyboard navigation
 *
 * Features:
 * - Single and multi-select (Ctrl+Click)
 * - Keyboard navigation (Up/Down/Enter)
 * - Double-click activation
 * - Customizable rendering
 * - Accessible (ARIA roles and states)
 */
export function MultiSelectList<T>({
  items,
  itemKey,
  renderItem,
  emptyState = 'No items',
  className = '',
  selectionConfig = {},
  selection: controlledSelection,
  keyboardNav = true,
  onSelect,
  onActivate,
  onNavigationEscape,
  onFocusItem
}: MultiSelectListProps<T>) {
  const {
    multiSelect = true,
    wrapNavigation = true
  } = selectionConfig;

  // State
  const [internalSelection, setInternalSelection] = useState<Set<string | number>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Use controlled or internal selection
  const selectedKeys = controlledSelection
    ? new Set(controlledSelection)
    : internalSelection;

  // Helper to get key from item
  const getItemKey = useCallback((item: T): string | number => {
    if (typeof itemKey === 'function') {
      return itemKey(item);
    }
    return item[itemKey] as string | number;
  }, [itemKey]);

  // Update selection
  const updateSelection = useCallback((newSelection: Set<string | number>) => {
    if (!controlledSelection) {
      setInternalSelection(newSelection);
    }

    if (onSelect) {
      const selectedItems = items.filter(item =>
        newSelection.has(getItemKey(item))
      );
      onSelect(Array.from(newSelection), selectedItems);
    }
  }, [controlledSelection, items, getItemKey, onSelect]);

  // Handle item click
  const handleItemClick = useCallback((item: T, index: number, event: React.MouseEvent) => {
    const key = getItemKey(item);
    const isCtrlKey = event.ctrlKey || event.metaKey;

    if (isCtrlKey && multiSelect) {
      // Multi-select mode: toggle selection
      const newSelection = new Set(selectedKeys);
      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }
      updateSelection(newSelection);
    } else {
      // Single select mode: select only this item
      const newSelection = new Set([key]);
      updateSelection(newSelection);
    }

    // Update focused index
    setFocusedIndex(index);
  }, [getItemKey, multiSelect, selectedKeys, updateSelection]);

  // Handle double-click activation
  const handleItemDoubleClick = useCallback((item: T) => {
    if (onActivate) {
      onActivate(item);
    }
  }, [onActivate]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!keyboardNav || items.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev + 1;
          const newIndex = next >= items.length ? (wrapNavigation ? 0 : prev) : next;

          // Select the item when navigating with arrow keys
          if (newIndex !== prev && items[newIndex]) {
            const itemKey = getItemKey(items[newIndex]);
            // Single selection - replace current selection
            const newSelection = new Set<string | number>([itemKey]);
            updateSelection(newSelection);
          }

          return newIndex;
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev - 1;
          let newIndex: number;

          if (next < 0) {
            // User is at top and pressed up - escape to search
            if (onNavigationEscape) {
              onNavigationEscape();
              return 0; // Stay at first item when escaping (don't wrap)
            }
            newIndex = wrapNavigation ? items.length - 1 : 0;
          } else {
            newIndex = next;
          }

          // Select the item when navigating with arrow keys
          if (newIndex !== prev && items[newIndex]) {
            const itemKey = getItemKey(items[newIndex]);
            // Single selection - replace current selection
            const newSelection = new Set<string | number>([itemKey]);
            updateSelection(newSelection);
          }

          return newIndex;
        });
        break;

      case 'Enter':
        event.preventDefault();
        if (items[focusedIndex] && onActivate) {
          onActivate(items[focusedIndex]);
        }
        break;

      default:
        break;
    }
  }, [keyboardNav, items, focusedIndex, wrapNavigation, onNavigationEscape, onActivate, getItemKey, updateSelection]);

  // Scroll focused item into view
  useEffect(() => {
    const focusedElement = itemRefs.current.get(focusedIndex);
    if (focusedElement && keyboardNav) {
      focusedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });

      // Call focus callback
      if (onFocusItem && items[focusedIndex]) {
        onFocusItem(items[focusedIndex], focusedIndex);
      }
    }
  }, [focusedIndex, keyboardNav, items, onFocusItem]);

  // Reset focused index if items change
  useEffect(() => {
    if (focusedIndex >= items.length) {
      setFocusedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, focusedIndex]);

  // Empty state
  if (items.length === 0) {
    return (
      <div className={`multi-select-list empty ${className}`} role="status">
        {typeof emptyState === 'string' ? (
          <div className="empty-state">{emptyState}</div>
        ) : emptyState}
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className={`multi-select-list ${className}`}
      role="listbox"
      aria-multiselectable={multiSelect}
      aria-activedescendant={`item-${focusedIndex}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        const key = getItemKey(item);
        const isSelected = selectedKeys.has(key);
        const isFocused = keyboardNav && focusedIndex === index;

        return (
          <div
            key={String(key)}
            id={`item-${index}`}
            ref={el => {
              if (el) {
                itemRefs.current.set(index, el);
              } else {
                itemRefs.current.delete(index);
              }
            }}
            className={`list-item ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
            role="option"
            aria-selected={isSelected}
            tabIndex={-1}
            onClick={(e) => handleItemClick(item, index, e)}
            onDoubleClick={() => handleItemDoubleClick(item)}
          >
            {renderItem(item, index)}
          </div>
        );
      })}
    </div>
  );
}
