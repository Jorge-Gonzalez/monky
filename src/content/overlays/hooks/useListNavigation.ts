import { useState, useCallback, useEffect } from 'react'

interface ListNavigationOptions {
  /** Start (and reset) with no selection (-1) instead of the first item. */
  allowEmpty?: boolean
}

export function useListNavigation(itemCount: number, { allowEmpty = false }: ListNavigationOptions = {}) {
  const emptyIndex = allowEmpty ? -1 : 0
  const [selectedIndex, setSelectedIndex] = useState(emptyIndex)

  // Clamp or reset when item count changes
  useEffect(() => {
    if (itemCount === 0) {
      setSelectedIndex(emptyIndex)
    } else if (selectedIndex >= itemCount) {
      setSelectedIndex(itemCount - 1)
    }
  }, [itemCount, selectedIndex, emptyIndex])

  // Both directions wrap; from the empty state (-1), next lands on the first
  // item and prev on the last.
  const navigateNext = useCallback(() => {
    if (itemCount === 0) return
    setSelectedIndex(prev => (prev < itemCount - 1 ? prev + 1 : 0))
  }, [itemCount])

  const navigatePrev = useCallback(() => {
    if (itemCount === 0) return
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : itemCount - 1))
  }, [itemCount])

  const reset = useCallback(() => {
    setSelectedIndex(emptyIndex)
  }, [emptyIndex])

  const selectIndex = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setSelectedIndex(index)
    }
  }, [itemCount])

  return { selectedIndex, navigateNext, navigatePrev, reset, selectIndex }
}
