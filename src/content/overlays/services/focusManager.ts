import { getActiveEditable, getSelection } from '../../editableUtils';

interface SavedFocusState {
  element: HTMLElement;
  cursorPosition: { start: number; end: number } | null;
}

export function createFocusManager() {
  let savedState: SavedFocusState | null = null;

  const saveFocus = (): void => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return;

    const editableElement = getActiveEditable(activeElement);
    const cursorPosition = editableElement ? getSelection(editableElement) : null;

    savedState = {
      element: activeElement,
      cursorPosition,
    };
  };

  const restoreFocus = (delay: number = 10): void => {
    if (!savedState || !document.body.contains(savedState.element)) {
      savedState = null;
      return;
    }

    setTimeout(() => {
      savedState?.element.focus();
      savedState = null;
    }, delay);
  };

  const getSavedState = (): SavedFocusState | null => savedState;

  const clear = (): void => {
    savedState = null;
  };

  return {
    saveFocus,
    restoreFocus,
    getSavedState,
    clear,
  };
}

export type FocusManager = ReturnType<typeof createFocusManager>;
