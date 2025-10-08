import { EditorActions } from '../actions/editorActions';
import { useMacroStore } from '../../store/useMacroStore';
import { Macro } from '../../types';

interface EditorState {
  macros: Macro[];
  editingMacro: Macro | null;
  settings: any; // Should be MacroConfig but keeping it generic for now
  error: string | null;
}

export interface EditorManager {
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
}

export function createEditorManager(actions: EditorActions): EditorManager {
  let subscribers: Array<(state: EditorState) => void> = [];
  let localEditingMacro: Macro | null = null;

  const notifySubscribers = () => {
    const state = getState();
    subscribers.forEach(callback => callback(state));
  };

  const getState = (): EditorState => {
    const storeState = useMacroStore.getState();
    return {
      macros: storeState.macros,
      editingMacro: localEditingMacro,
      settings: storeState.config,
      error: null, // This would be managed as part of state if needed
    };
  };

  // Subscribe to store changes to notify subscribers
  const unsubscribeStore = useMacroStore.subscribe(() => {
    notifySubscribers();
  });

  const manager: EditorManager = {
    async createMacro(macro) {
      const result = await actions.onMacroCreated(macro);
      if (result.success) {
        localEditingMacro = null; // Reset after successful creation
      }
      return result;
    },

    async updateMacro(id, macro) {
      const result = await actions.onMacroUpdated(id, macro);
      if (result.success) {
        localEditingMacro = null; // Reset after successful update
      }
      return result;
    },

    async deleteMacro(id) {
      return await actions.onMacroDeleted(id);
    },

    getEditingMacro() {
      return localEditingMacro;
    },

    setEditingMacro(macro) {
      localEditingMacro = macro;
      notifySubscribers();
    },

    resetForm() {
      localEditingMacro = null;
      notifySubscribers();
    },

    updateSettings(settings) {
      actions.onSettingsChanged(settings);
    },

    getState,

    subscribe(callback) {
      subscribers.push(callback);
      
      // Return unsubscribe function
      return () => {
        subscribers = subscribers.filter(sub => sub !== callback);
      };
    }
  };

  // Cleanup function for when manager is no longer needed
  (manager as any).destroy = () => {
    if (unsubscribeStore) unsubscribeStore();
  };

  return manager;
}