import { useState, useRef, useEffect } from 'react';
import { createEditorManager } from '../managers/editorManager';
import { createEditorCoordinator, EditorCoordinator } from '../coordinators/editorCoordinator';
import { createDefaultEditorActions } from '../actions/createDefaultEditorActions';

/**
 * Hook to get the editor coordinator instance.
 */
export function useEditorCoordinator(): EditorCoordinator {
  const [coordinator] = useState(() => {
    const actions = createDefaultEditorActions();
    const manager = createEditorManager(actions);
    return createEditorCoordinator(manager);
  });

  const coordinatorRef = useRef<EditorCoordinator>(coordinator);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      coordinatorRef.current.destroy();
    };
  }, []);

  return coordinatorRef.current;
}
