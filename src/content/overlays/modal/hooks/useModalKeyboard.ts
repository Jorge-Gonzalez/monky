import { useEffect } from 'react';

/**
 * Hook to handle global modal keyboard events (Escape to close)
 *
 * @param isActive - Whether the modal is currently visible
 * @param onClose - Callback to close the modal
 */
export function useModalKeyboard(isActive: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    // Use capture phase to handle before other handlers
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive, onClose]);
}
