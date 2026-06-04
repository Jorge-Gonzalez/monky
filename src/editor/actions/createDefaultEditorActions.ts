import { EditorActions } from './editorActions';
import { useMacroStore } from '../../store/useMacroStore';
import { pushCreate, pushUpdate, pushDelete } from '../../lib/sync';
import { getErrorMessage } from '../../lib/errors';

/**
 * Creates default editor actions that interact with the global store.
 * The store is updated first (local source of truth); lib/sync then pushes the
 * change to the backend.
 */
export function createDefaultEditorActions(): EditorActions {
  return {
    async onMacroCreated(macro) {
      const { addMacro } = useMacroStore.getState();
      const newMacro = { id: Date.now().toString(), ...macro, updated_at: new Date().toISOString() } as any; // TODO: fix type
      const result = addMacro(newMacro);

      if (result.success) {
        await pushCreate(newMacro);
        return { success: true };
      } else {
        const error = getErrorMessage(result.error, newMacro.command);
        return { success: false, error };
      }
    },

    async onMacroUpdated(id, macro) {
      const { updateMacro } = useMacroStore.getState();
      const patch = { ...macro, updated_at: new Date().toISOString() };
      const result = updateMacro(id, patch);

      if (result.success) {
        await pushUpdate({ id, ...patch });
        return { success: true };
      } else {
        const error = getErrorMessage(result.error, macro.command || '');
        return { success: false, error };
      }
    },

    async onMacroDeleted(macroId) {
      const { deleteMacro } = useMacroStore.getState();
      deleteMacro(macroId);
      await pushDelete(macroId);
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