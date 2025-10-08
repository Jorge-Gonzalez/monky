import { useState, useEffect, useRef } from 'react';
import { createDefaultEditorActions } from '../actions/createDefaultEditorActions';
import { createEditorManager, EditorManager } from './createEditorManager';

export function useEditorManager(): EditorManager {
  const [manager] = useState(() => {
    const actions = createDefaultEditorActions();
    return createEditorManager(actions);
  });
  
  const managerRef = useRef<EditorManager>(manager);
  
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