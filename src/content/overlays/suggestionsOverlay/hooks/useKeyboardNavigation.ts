import { useEffect } from 'react';

interface KeyboardNavigationOptions {
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onNavigateLeft: () => void;
  onNavigateRight: () => void;
  preventTabHandling?: boolean;
}

export function useKeyboardNavigation({
  isActive,
  onSelect,
  onClose,
  onNavigateLeft,
  onNavigateRight,
  preventTabHandling = false,
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
          if (!preventTabHandling) {
            e.preventDefault();
            if (e.shiftKey) {
              onNavigateLeft();
            } else {
              onNavigateRight();
            }
          }
          break;
        case 'Enter':
          e.preventDefault();
          onSelect();
          break;
      }
    };

    // Listen on the main document only. On Google Docs, showAll mode steals focus
    // from the iframe to a guard element in the main document, so events arrive
    // here naturally and never reach Google Docs' iframe handlers.
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isActive, onSelect, onClose, onNavigateLeft, onNavigateRight, preventTabHandling]);
}