import { EditorManager, EditorState } from '../managers/editorManager';
import { Macro } from '../../types';

/**
 * EditorCoordinator: Public API for the editor system
 *
 * Responsibilities:
 * - Provide clean public API for the editor
 * - Handle lifecycle management (attach/detach, enable/disable)
 * - Wrapper around EditorManager
 * - Integration point with the rest of the application
 */
export interface EditorCoordinator {
  // Macro CRUD operations
  createMacro(macro: Omit<Macro, 'id'>): Promise<{ success: boolean; error?: string }>;
  updateMacro(id: string, macro: Partial<Macro>): Promise<{ success: boolean; error?: string }>;
  deleteMacro(id: string): Promise<{ success: boolean; error?: string }>;

  // Form state management
  getEditingMacro(): Macro | null;
  setEditingMacro(macro: Macro | null): void;
  resetForm(): void;

  // Settings management
  updateSettings(settings: any): void;

  // State retrieval
  getState(): EditorState;

  // Subscription
  subscribe(callback: (state: EditorState) => void): () => void;

  // Lifecycle
  attach(): void;
  detach(): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  destroy(): void;
}

/**
 * Create an editor coordinator
 */
export function createEditorCoordinator(
  manager: EditorManager
): EditorCoordinator {
  let isEnabled = true;

  /**
   * Create a macro
   */
  const createMacro = async (macro: Omit<Macro, 'id'>): Promise<{ success: boolean; error?: string }> => {
    if (!isEnabled) return { success: false, error: 'Editor is disabled' };
    return await manager.createMacro(macro);
  };

  /**
   * Update a macro
   */
  const updateMacro = async (id: string, macro: Partial<Macro>): Promise<{ success: boolean; error?: string }> => {
    if (!isEnabled) return { success: false, error: 'Editor is disabled' };
    return await manager.updateMacro(id, macro);
  };

  /**
   * Delete a macro
   */
  const deleteMacro = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!isEnabled) return { success: false, error: 'Editor is disabled' };
    return await manager.deleteMacro(id);
  };

  /**
   * Get the currently editing macro
   */
  const getEditingMacro = (): Macro | null => {
    return manager.getEditingMacro();
  };

  /**
   * Set the macro being edited
   */
  const setEditingMacro = (macro: Macro | null): void => {
    if (!isEnabled) return;
    manager.setEditingMacro(macro);
  };

  /**
   * Reset the form
   */
  const resetForm = (): void => {
    if (!isEnabled) return;
    manager.resetForm();
  };

  /**
   * Update settings
   */
  const updateSettings = (settings: any): void => {
    if (!isEnabled) return;
    manager.updateSettings(settings);
  };

  /**
   * Get the current editor state
   */
  const getState = (): EditorState => {
    return manager.getState();
  };

  /**
   * Subscribe to editor state changes
   */
  const subscribe = (callback: (state: EditorState) => void): (() => void) => {
    return manager.subscribe(callback);
  };

  /**
   * Attach any event listeners or initialize resources
   * (Currently no-op, but provides extension point for future features)
   */
  const attach = (): void => {
    // Future: Could attach keyboard shortcuts, message listeners, etc.
  };

  /**
   * Detach event listeners and clean up
   */
  const detach = (): void => {
    // Future: Clean up any attached listeners
  };

  /**
   * Enable the editor coordinator
   */
  const enable = (): void => {
    isEnabled = true;
  };

  /**
   * Disable the editor coordinator
   */
  const disable = (): void => {
    isEnabled = false;
  };

  /**
   * Check if the coordinator is enabled
   */
  const isEnabledFn = (): boolean => {
    return isEnabled;
  };

  /**
   * Destroy the coordinator and clean up all resources
   */
  const destroy = (): void => {
    detach();
    if ((manager as any).destroy) {
      (manager as any).destroy();
    }
  };

  const coordinator: EditorCoordinator = {
    createMacro,
    updateMacro,
    deleteMacro,
    getEditingMacro,
    setEditingMacro,
    resetForm,
    updateSettings,
    getState,
    subscribe,
    attach,
    detach,
    enable,
    disable,
    isEnabled: isEnabledFn,
    destroy,
  };

  return coordinator;
}
