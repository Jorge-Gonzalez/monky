import { EditorActions } from './editorActions';
import { useMacroStore } from '../../store/useMacroStore';
import { createMacroLocalFirst, updateMacroLocalFirst, deleteMacroLocalFirst } from '../../lib/sync';
import { getErrorMessage } from '../../lib/errors';

/**
 * Creates default editor actions that interact with the global store.
 */
export function createDefaultEditorActions(): EditorActions {
  return {
    async onMacroCreated(macro) {
      const { addMacro } = useMacroStore.getState();
      const newMacro = { id: Date.now().toString(), ...macro } as any; // TODO: fix type
      const result = addMacro(newMacro);
      
      if (result.success) {
        await createMacroLocalFirst(newMacro);
        return { success: true };
      } else {
        const error = getErrorMessage(result.error, newMacro.command);
        return { success: false, error };
      }
    },

    async onMacroUpdated(id, macro) {
      const { updateMacro } = useMacroStore.getState();
      const result = updateMacro(id, macro);
      
      if (result.success) {
        await updateMacroLocalFirst({ id, ...macro });
        return { success: true };
      } else {
        const error = getErrorMessage(result.error, macro.command || '');
        return { success: false, error };
      }
    },

    async onMacroDeleted(macroId) {
      const { deleteMacro } = useMacroStore.getState();
      deleteMacro(macroId);
      await deleteMacroLocalFirst(macroId);
      return { success: true };
    },

    onSettingsChanged(settings) {
      const state = useMacroStore.getState();
      if (settings.language) {
        state.setLanguage(settings.language);
      }
    },

    onError(error) {
      console.error('Editor error:', error);
      // Could dispatch to UI for user feedback
    }
  }
}