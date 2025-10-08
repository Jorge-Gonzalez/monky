/**
 * Interface defining actions that the editor can trigger.
 * This creates a clear contract between the editor and its handlers.
 */
export interface EditorActions {
  /**
   * Called when a new macro is created.
   */
  onMacroCreated(macro: any): void

  /**
   * Called when a macro is updated.
   */
  onMacroUpdated(macro: any): void

  /**
   * Called when a macro is deleted.
   */
  onMacroDeleted(macroId: string): void

  /**
   * Called when editor settings are changed.
   */
  onSettingsChanged(settings: any): void

  /**
   * Called when there's an error in the editor.
   */
  onError(error: string): void
}

/**
 * Default implementation that interacts with the store directly.
 */
export function createStoreEditorActions(): EditorActions {
  const { addMacro, updateMacro, deleteMacro, setLanguage } = useMacroStore;

  return {
    onMacroCreated(macro) {
      const result = addMacro(macro);
      if (result.success) {
        // Persist to storage
        createMacroLocalFirst(macro);
      } else {
        this.onError(result.error || 'Failed to create macro');
      }
    },

    onMacroUpdated(macro) {
      const result = updateMacro(macro.id, macro);
      if (result.success) {
        // Persist to storage
        updateMacroLocalFirst(macro);
      } else {
        this.onError(result.error || 'Failed to update macro');
      }
    },

    onMacroDeleted(macroId) {
      deleteMacro(macroId);
      // Persist to storage
      deleteMacroLocalFirst(macroId);
    },

    onSettingsChanged(settings) {
      if (settings.language) {
        setLanguage(settings.language);
      }
    },

    onError(error) {
      console.error('Editor error:', error);
      // Could dispatch to UI for user feedback
    }
  }
}

/**
 * No-op implementation for testing or when no actions are needed.
 */
export const noOpEditorActions: EditorActions = {
  onMacroCreated: () => {},
  onMacroUpdated: () => {},
  onMacroDeleted: () => {},
  onSettingsChanged: () => {},
  onError: () => {},
}