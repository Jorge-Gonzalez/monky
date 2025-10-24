import { useEffect } from 'react';
import { Macro } from '../../../../types';

const EVENT_NAME = 'new-macro-suggestion-selected';

interface MacroReplacementOptions {
  activeElement: HTMLElement | null;
  trigger: string;
  onReplacement: (text: string) => void;
}

export function useMacroReplacement({ activeElement, trigger, onReplacement }: MacroReplacementOptions) {
  useEffect(() => {
    if (!activeElement) return;

    const handleMacroSelected = (event: CustomEvent) => {
      const { macro }: { macro: Macro } = event.detail;

      if (activeElement && 'value' in activeElement && typeof activeElement.value === 'string') {
        const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
        const currentText = input.value;
        const triggerIndex = currentText.lastIndexOf(trigger);

        if (triggerIndex !== -1) {
          const textBefore = currentText.substring(0, triggerIndex);
          const newText = `${textBefore}${macro.text}`;
          
          onReplacement(newText);
        }
      }
    };

    document.addEventListener(EVENT_NAME, handleMacroSelected as EventListener);

    return () => {
      document.removeEventListener(EVENT_NAME, handleMacroSelected as EventListener);
    };
  }, [activeElement, trigger, onReplacement]);
}