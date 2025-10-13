import { useEffect } from 'react';

interface KeyboardNavigationOptions {
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onNavigateLeft: () => void;
  onNavigateRight: () => void;
}

export function useKeyboardNavigation({
  isActive,
  onSelect,
  onClose,
  onNavigateLeft,
  onNavigateRight,
}: KeyboardNavigationOptions) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNavigateRight();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onNavigateLeft();
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            onNavigateLeft();
          } else {
            onNavigateRight();
          }
          break;
        case 'Enter':
          e.preventDefault();
          onSelect();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, onSelect, onClose, onNavigateLeft, onNavigateRight]);
}