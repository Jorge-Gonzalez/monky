import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useScrollIntoView(
  containerRef: RefObject<HTMLElement | null>,
  selectedIndex: number,
  selector: string = '.selected'
) {
  useEffect(() => {
    if (!containerRef.current) return;

    const selectedItem = containerRef.current.querySelector(selector);
    if (selectedItem && typeof selectedItem.scrollIntoView === 'function') {
      selectedItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [containerRef, selectedIndex, selector]);
}