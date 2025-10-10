import { useEffect, RefObject } from 'react';

export function useAutoFocus(inputRef: RefObject<HTMLInputElement>, isActive: boolean, delay: number = 10) {
  useEffect(() => {
    if (isActive) {
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [isActive, inputRef, delay]);
}