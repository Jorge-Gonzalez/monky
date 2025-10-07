import { useState, useCallback, useEffect } from 'react';

export function useListNavigation(itemCount: number) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset when item count changes
  useEffect(() => {
    if (selectedIndex >= itemCount && itemCount > 0) {
      setSelectedIndex(0);
    }
  }, [itemCount, selectedIndex]);

  const navigateDown = useCallback(() => {
    setSelectedIndex(prev => (prev < itemCount - 1 ? prev + 1 : 0));
  }, [itemCount]);

  const navigateUp = useCallback(() => {
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : itemCount - 1));
  }, [itemCount]);

  const reset = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    navigateDown,
    navigateUp,
    reset,
  };
}