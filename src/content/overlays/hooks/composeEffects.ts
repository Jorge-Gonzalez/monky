import { useCallback } from "react";

/**
 * 
 * @param effects react effects to apply to a ref element
 * @description
 * A hook that allows you to apply multiple effects to a ref element.
 * Each effect can optionally return a cleanup function that will be called when the element is unmounted or when the ref changes.
 * Manages:
 * - Ref timing, it fires when ready
 * - Compose multiple effects
 * - Collect and run all the cleanups
 * - UseCallback with deps to remain reactive
 * - Type safety (generics)
 * @returns A callback function that takes a ref element and applies the effects to it.
 */

export function useRefEffects<T extends HTMLElement>(
  ...effects: Array<(element: T) => void | (() => void)>
) {
  return useCallback((element: T | null) => {
    if (!element) return;
    
    const cleanups = effects
      .map(effect => effect(element))
      .filter(Boolean) as Array<() => void>;
    
    return () => cleanups.forEach(cleanup => cleanup());
  }, effects);
}