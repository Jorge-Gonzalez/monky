import { useEffect } from 'react';
import { ModalView } from '../types';

const VIEWS: ModalView[] = ['search', 'editor', 'settings'];

export function useModalKeyboard(
  isActive: boolean,
  onClose: () => void,
  currentView: ModalView,
  onViewChange: (view: ModalView) => void
): void {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const target = event.target as HTMLElement;
        const isEditing =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;
        if (isEditing) return;

        event.preventDefault();
        event.stopPropagation();
        const current = VIEWS.indexOf(currentView);
        const delta = event.key === 'ArrowRight' ? 1 : -1;
        onViewChange(VIEWS[(current + delta + VIEWS.length) % VIEWS.length]);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive, onClose, currentView, onViewChange]);
}
