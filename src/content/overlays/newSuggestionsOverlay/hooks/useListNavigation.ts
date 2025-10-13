import { useState, useCallback, useEffect } from 'react';

export function useListNavigation(itemCount: number) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset index if item count changes
  useEffect(() => {
    if (itemCount === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= itemCount) {
      setSelectedIndex(Math.max(0, itemCount - 1));
    }
  }, [itemCount, selectedIndex]);

  const navigateRight = useCallback(() => {
    if (itemCount === 0) return;
    setSelectedIndex(prev => (prev < itemCount - 1 ? prev + 1 : 0));
  }, [itemCount]);

  const navigateLeft = useCallback(() => {
    if (itemCount === 0) return;
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : itemCount - 1));
  }, [itemCount]);

  const reset = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  const selectIndex = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setSelectedIndex(index);
    }
  }, [itemCount]);

  return {
    selectedIndex,
    navigateLeft,
    navigateRight,
    reset,
  };
}