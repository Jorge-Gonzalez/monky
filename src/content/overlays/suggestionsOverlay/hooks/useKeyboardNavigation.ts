import { useEffect } from 'react';

interface KeyboardNavigationOptions {
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onNavigateLeft: () => void;
  onNavigateRight: () => void;
  preventTabHandling?: boolean; // New option to prevent Tab handling
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
      console.log('useKeyboardNavigation: key pressed:', e.key, 'isActive:', isActive, 'preventTabHandling:', preventTabHandling);
      
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowRight':
          console.log('useKeyboardNavigation: handling ArrowRight');
          e.preventDefault();
          onNavigateRight();
          break;
        case 'ArrowLeft':
          console.log('useKeyboardNavigation: handling ArrowLeft');
          e.preventDefault();
          onNavigateLeft();
          break;
        case 'Tab':
          // Only handle Tab if we're not preventing it
          // This allows the macro detector to handle the initial Tab press
          if (!preventTabHandling) {
            console.log('useKeyboardNavigation: handling Tab');
            e.preventDefault();
            if (e.shiftKey) {
              onNavigateLeft();
            } else {
              onNavigateRight();
            }
          } else {
            console.log('useKeyboardNavigation: ignoring Tab (preventTabHandling=true)');
          }
          break;
        case 'Enter':
          console.log('useKeyboardNavigation: handling Enter');
          e.preventDefault();
          onSelect();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, onSelect, onClose, onNavigateLeft, onNavigateRight, preventTabHandling]);
}