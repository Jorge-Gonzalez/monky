import { useEffect, RefObject } from 'react';

type FocusableElement = HTMLElement & { focus: () => void };

export function useAutoFocus<T extends FocusableElement>(
  inputRef: RefObject<T>, 
  isActive: boolean
) {
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive, inputRef]);
}

export function useAutoFocusB<T extends FocusableElement>(
  ref: RefObject<T>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const el = ref.current;
    if (el && typeof el.focus === "function") {
      // If the element can’t normally receive focus, ensure it can
      if (el.tabIndex === -1) el.tabIndex = 0;
      el.focus();
    }
  }, [enabled]);
}