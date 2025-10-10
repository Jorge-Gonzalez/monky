import { useState, useCallback, useEffect } from 'react';

export function useListNavigation(itemCount: number) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Auto-select first item when items are available
  useEffect(() => {
    if (itemCount > 0 && selectedIndex === -1) {
      setSelectedIndex(0);
    } else if (itemCount === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex >= itemCount) {
      setSelectedIndex(Math.max(0, itemCount - 1));
    }
  }, [itemCount, selectedIndex]);

  const navigateDown = useCallback(() => {
    if (itemCount === 0) return;
    setSelectedIndex(prev => {
      if (prev === -1) return 0;
      return prev < itemCount - 1 ? prev + 1 : 0;
    });
  }, [itemCount]);

  const navigateUp = useCallback(() => {
    if (itemCount === 0) return;
    setSelectedIndex(prev => {
      if (prev === -1) return itemCount - 1;
      return prev > 0 ? prev - 1 : itemCount - 1;
    });
  }, [itemCount]);

  const reset = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  const selectIndex = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setSelectedIndex(index);
    }
  }, [itemCount]);

  return {
    selectedIndex,
    setSelectedIndex,
    navigateDown,
    navigateUp,
    reset,
    selectIndex,
    hasValidSelection: selectedIndex >= 0 && selectedIndex < itemCount,
  };
}