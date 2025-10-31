// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createOptionsManager, OptionsManager } from './optionsManager';
import { useMacroStore } from '../../store/useMacroStore';

describe('OptionsManager', () => {
  let manager: OptionsManager;

  beforeEach(() => {
    // Reset the store to default state before each test
    const store = useMacroStore.getState();
    store.setPrefixes(['::']);
    store.setUseCommitKeys(false);

    // Create a fresh manager instance
    manager = createOptionsManager();
  });

  afterEach(() => {
    // Clean up
    manager.destroy();
  });

  describe('initialization', () => {
    it('should initialize with state from the store', () => {
      const state = manager.getState();
      expect(state.prefixes).toEqual(['::']);
      expect(state.useCommitKeys).toBe(false);
    });
  });

  describe('setPrefixes', () => {
    it('should update prefixes in manager state', () => {
      manager.setPrefixes(['/', '::', ';']);
      const state = manager.getState();
      expect(state.prefixes).toEqual(['/', '::', ';']);
    });

    it('should sync prefixes to the Zustand store', () => {
      manager.setPrefixes(['/', '::', ';']);
      const storeState = useMacroStore.getState();
      expect(storeState.config.prefixes).toEqual(['/', '::', ';']);
    });

    it('should notify subscribers of prefix changes', () => {
      const callback = vi.fn();
      manager.subscribe(callback);

      // Clear the initial call
      callback.mockClear();

      manager.setPrefixes(['/', '::', ';']);

      expect(callback).toHaveBeenCalledWith({
        prefixes: ['/', '::', ';'],
        useCommitKeys: false,
      });
    });

    it('should reject invalid prefixes', () => {
      // Try to set non-array value
      const callback = vi.fn();
      manager.subscribe(callback);
      callback.mockClear();

      manager.setState({ prefixes: 'invalid' as any });

      // Callback should not be called because validation failed
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('setUseCommitKeys', () => {
    it('should update useCommitKeys in manager state', () => {
      manager.setUseCommitKeys(true);
      const state = manager.getState();
      expect(state.useCommitKeys).toBe(true);
    });

    it('should sync useCommitKeys to the Zustand store', () => {
      manager.setUseCommitKeys(true);
      const storeState = useMacroStore.getState();
      expect(storeState.config.useCommitKeys).toBe(true);
    });

    it('should notify subscribers of useCommitKeys changes', () => {
      const callback = vi.fn();
      manager.subscribe(callback);

      // Clear the initial call
      callback.mockClear();

      manager.setUseCommitKeys(true);

      expect(callback).toHaveBeenCalledWith({
        prefixes: ['::'],
        useCommitKeys: true,
      });
    });

    it('should toggle useCommitKeys multiple times correctly', () => {
      // Toggle to true
      manager.setUseCommitKeys(true);
      expect(manager.getState().useCommitKeys).toBe(true);
      expect(useMacroStore.getState().config.useCommitKeys).toBe(true);

      // Toggle to false
      manager.setUseCommitKeys(false);
      expect(manager.getState().useCommitKeys).toBe(false);
      expect(useMacroStore.getState().config.useCommitKeys).toBe(false);

      // Toggle to true again
      manager.setUseCommitKeys(true);
      expect(manager.getState().useCommitKeys).toBe(true);
      expect(useMacroStore.getState().config.useCommitKeys).toBe(true);
    });
  });

  describe('combined updates', () => {
    it('should handle multiple rapid updates correctly', () => {
      manager.setPrefixes(['/', ';']);
      manager.setUseCommitKeys(true);
      manager.setPrefixes(['/']);
      manager.setUseCommitKeys(false);

      const state = manager.getState();
      const storeState = useMacroStore.getState();

      expect(state.prefixes).toEqual(['/']);
      expect(state.useCommitKeys).toBe(false);
      expect(storeState.config.prefixes).toEqual(['/']);
      expect(storeState.config.useCommitKeys).toBe(false);
    });

    it('should update both prefixes and useCommitKeys via setState', () => {
      manager.setState({
        prefixes: ['/', '::', ';'],
        useCommitKeys: true,
      });

      const state = manager.getState();
      const storeState = useMacroStore.getState();

      expect(state.prefixes).toEqual(['/', '::', ';']);
      expect(state.useCommitKeys).toBe(true);
      expect(storeState.config.prefixes).toEqual(['/', '::', ';']);
      expect(storeState.config.useCommitKeys).toBe(true);
    });
  });

  describe('external store changes', () => {
    it('should sync from store when changed externally', () => {
      // Simulate external change (e.g., from popup)
      const store = useMacroStore.getState();
      store.setPrefixes(['#', '!']);
      store.setUseCommitKeys(true);

      // Manager should have synced
      const state = manager.getState();
      expect(state.prefixes).toEqual(['#', '!']);
      expect(state.useCommitKeys).toBe(true);
    });

    it('should notify subscribers when store changes externally', () => {
      const callback = vi.fn();
      manager.subscribe(callback);

      // Clear initial call
      callback.mockClear();

      // Simulate external change (both calls will trigger subscription)
      const store = useMacroStore.getState();
      store.setPrefixes(['#', '!']);
      store.setUseCommitKeys(true);

      // Should have been called twice (once for each store update)
      expect(callback).toHaveBeenCalled();

      // Last call should have the final state
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1][0];
      expect(lastCall.prefixes).toEqual(['#', '!']);
      expect(lastCall.useCommitKeys).toBe(true);
    });
  });

  describe('subscription management', () => {
    it('should call subscriber immediately with current state', () => {
      const callback = vi.fn();
      manager.subscribe(callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        prefixes: ['::'],
        useCommitKeys: false,
      });
    });

    it('should support multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.subscribe(callback1);
      manager.subscribe(callback2);

      // Clear initial calls
      callback1.mockClear();
      callback2.mockClear();

      manager.setUseCommitKeys(true);

      expect(callback1).toHaveBeenCalledWith({
        prefixes: ['::'],
        useCommitKeys: true,
      });
      expect(callback2).toHaveBeenCalledWith({
        prefixes: ['::'],
        useCommitKeys: true,
      });
    });

    it('should unsubscribe correctly', () => {
      const callback = vi.fn();
      const unsubscribe = manager.subscribe(callback);

      // Clear initial call
      callback.mockClear();

      // Unsubscribe
      unsubscribe();

      // Make a change
      manager.setUseCommitKeys(true);

      // Callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should validate prefixes array', () => {
      expect(manager.validate({ prefixes: ['/', '::'] })).toBe(true);
      expect(manager.validate({ prefixes: [] })).toBe(true); // Empty array is valid for validation
      expect(manager.validate({ prefixes: 'invalid' as any })).toBe(false);
      expect(manager.validate({ prefixes: ['', '::'] })).toBe(false); // Empty string not allowed
      expect(manager.validate({ prefixes: [123 as any] })).toBe(false); // Non-string not allowed
    });

    it('should validate useCommitKeys boolean', () => {
      expect(manager.validate({ useCommitKeys: true })).toBe(true);
      expect(manager.validate({ useCommitKeys: false })).toBe(true);
      expect(manager.validate({ useCommitKeys: 'invalid' as any })).toBe(false);
      expect(manager.validate({ useCommitKeys: 1 as any })).toBe(false);
    });
  });

  describe('syncFromStore', () => {
    it('should manually sync from store', () => {
      // Change store externally without triggering subscription
      const store = useMacroStore.getState();
      store.setPrefixes(['/']);

      // Manually sync
      manager.syncFromStore();

      expect(manager.getState().prefixes).toEqual(['/']);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const callback = vi.fn();
      manager.subscribe(callback);

      manager.destroy();

      // Clear initial call
      callback.mockClear();

      // External store changes should no longer trigger manager
      const store = useMacroStore.getState();
      store.setUseCommitKeys(true);

      // Callback should not be called after destroy
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
