import { useState, useCallback } from 'react';
import { getActiveEditable, getSelection, EditableElement } from '../../../macroEngine/replacement/editableUtils';

interface SavedState {
  element: EditableElement;
  cursorPosition: { start: number; end: number } | null;
}

export function useFocusManager() {
  const [savedState, setSavedState] = useState<SavedState | null>(null);

  const saveFocus = useCallback(() => {
    const activeElement = getActiveEditable(document.activeElement);
    if (!activeElement) return;
    const cursorPosition = getSelection(activeElement);
    setSavedState({ element: activeElement, cursorPosition });
  }, []);

  const restoreFocus = useCallback((delay = 10) => {
    if (!savedState || !document.body.contains(savedState.element)) {
      setSavedState(null);
      return;
    }
    setTimeout(() => {
      savedState.element.focus();
    }, delay);
  }, [savedState]);

  return { saveFocus, restoreFocus, savedState };
}