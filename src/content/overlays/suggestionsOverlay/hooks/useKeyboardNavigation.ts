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

    const targets: EventTarget[] = [document];

    if (window.location.hostname === 'docs.google.com') {
      const iframe = document.querySelector('.docs-texteventtarget-iframe') as HTMLIFrameElement | null
      if (iframe?.contentDocument) targets.push(iframe.contentDocument)
    }

    for (const t of targets) t.addEventListener('keydown', handleKeyDown, true)
    return () => {
      for (const t of targets) t.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isActive, onSelect, onClose, onNavigateLeft, onNavigateRight, preventTabHandling]);
}