import { Macro } from '../../../types';
import { getActiveEditable, getSelection, replaceText } from '../../editableUtils';
import { FocusManager } from './focusManager';

export function createMacroInserter(focusManager: FocusManager) {
  const insertMacro = (macro: Macro, targetElement: HTMLElement | null): void => {
    if (!targetElement || !macro.text) return;

    const editableElement = getActiveEditable(targetElement);
    if (!editableElement) return;

    const savedState = focusManager.getSavedState();
    let cursorPosition = savedState?.cursorPosition;

    if (!cursorPosition) {
      cursorPosition = getSelection(editableElement);
    }

    if (!cursorPosition) return;

    replaceText(editableElement, macro, cursorPosition.start, cursorPosition.start);
  };

  return { insertMacro };
}

export type MacroInserter = ReturnType<typeof createMacroInserter>;
