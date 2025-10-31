import { useEffect } from 'react';

interface KeyboardNavigationOptions {
  isActive: boolean;
  itemCount: number;
  selectedIndex: number;
  onSelect: () => void;
  onClose: () => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
}

export function useKeyboardNavigation({
  isActive,
  onSelect,
  onClose,
  onNavigateUp,
  onNavigateDown,
}: KeyboardNavigationOptions) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onNavigateDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onNavigateUp();
          break;
        case 'Enter':
          e.preventDefault();
          onSelect();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, onSelect, onClose, onNavigateUp, onNavigateDown]);
}