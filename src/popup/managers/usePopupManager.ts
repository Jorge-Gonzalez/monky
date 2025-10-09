import { useState, useEffect, useRef } from 'react';
import { createDefaultPopupActions } from '../actions/createDefaultPopupActions';
import { createPopupManager, PopupManager } from './createPopupManager';

/**
 * A hook that provides an instance of the PopupManager.
 * It creates the manager with default actions and handles its lifecycle.
 */
export function usePopupManager(): PopupManager {
  // useState with a function ensures this is only created once per component instance.
  const [manager] = useState(() => {
    const actions = createDefaultPopupActions();
    return createPopupManager(actions);
  });

  const managerRef = useRef<PopupManager>(manager);

  useEffect(() => {
    // This effect handles the cleanup (destroy) function when the component unmounts.
    return () => {
      if ((managerRef.current as any).destroy) {
        (managerRef.current as any).destroy();
      }
    };
  }, []); // Empty dependency array means this runs only on mount and unmount.

  return managerRef.current;
}