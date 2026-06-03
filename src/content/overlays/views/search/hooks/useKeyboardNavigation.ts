import { useEffect } from 'react';

interface KeyboardNavigationOptions {
  isActive: boolean;
  itemCount: number;
  selectedIndex: number;
  onSelect: () => void;
  onClose: () => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onEdit?: () => void;
}

export function useKeyboardNavigation({
  isActive,
  selectedIndex,
  onSelect,
  onClose,
  onNavigateUp,
  onNavigateDown,
  onEdit,
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
        case 'Tab':
          if (onEdit && selectedIndex >= 0) {
            e.preventDefault();
            onEdit();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, selectedIndex, onSelect, onClose, onNavigateUp, onNavigateDown, onEdit]);
}