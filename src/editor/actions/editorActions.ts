import { Macro } from '../../types';
import { MacroConfig } from '../../store/useMacroStore';

/**
 * Interface defining actions that the editor can trigger.
 * This creates a clear contract between the editor and its handlers.
 */
export interface EditorActions {
  /**
   * Called when a new macro is created.
   */
  onMacroCreated(macro: Omit<Macro, 'id'> & { id?: string }): Promise<{ success: boolean; error?: string }>

  /**
   * Called when a macro is updated.
   */
  onMacroUpdated(id: string, macro: Partial<Macro>): Promise<{ success: boolean; error?: string }>

  /**
   * Called when a macro is deleted.
   */
  onMacroDeleted(macroId: string): Promise<{ success: boolean; error?: string }>

  /**
   * Called when editor settings are changed.
   */
  onSettingsChanged(settings: Partial<MacroConfig>): void

  /**
   * Called when there's an error in the editor.
   */
  onError(error: string): void
}

/**
 * No-op implementation for testing or when no actions are needed.
 */
export const noOpEditorActions: EditorActions = {
  onMacroCreated: async () => ({ success: true }),
  onMacroUpdated: async () => ({ success: true }),
  onMacroDeleted: async () => ({ success: true }),
  onSettingsChanged: () => {},
  onError: () => {},
}