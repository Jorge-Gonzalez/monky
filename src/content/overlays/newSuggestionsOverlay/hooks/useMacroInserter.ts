import { replaceText, EditableElement } from '../../../detector/editableUtils';
import { Macro } from '../../../../types';

interface SavedState {
  element: EditableElement;
  cursorPosition: { start: number; end: number } | null;
}

export function useMacroInserter(savedState: SavedState | null) {
  const insertMacro = (macro: Macro, trigger: string) => {
    if (!savedState || !macro.text) return;

    const { element } = savedState;
    const triggerIndex = (element.value || element.textContent || '').lastIndexOf(trigger);

    if (triggerIndex !== -1) {
      replaceText(element, macro, triggerIndex, triggerIndex + trigger.length);
    }
  };

  return { insertMacro };
}