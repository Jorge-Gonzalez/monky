import { useState, useEffect, useRef } from 'react';
import { createDefaultPopupActions } from '../actions/createDefaultPopupActions';
import { createPopupManager, PopupManager } from './createPopupManager';

export function usePopupManager(): PopupManager {
  const [manager] = useState(() => {
    const actions = createDefaultPopupActions();
    return createPopupManager(actions);
  });
  
  const managerRef = useRef<PopupManager>(manager);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if ((managerRef.current as any).destroy) {
        (managerRef.current as any).destroy();
      }
    };
  }, []);

  return managerRef.current;
}