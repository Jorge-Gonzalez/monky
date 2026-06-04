// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createOptionsManager } from '../managers/optionsManager';
import { createOptionsCoordinator, OptionsCoordinator } from './optionsCoordinator';
import { createDefaultOptionsActions } from '../actions/createDefaultOptionsActions';
import { OptionsActions } from '../actions/optionsActions';
import { useMacroStore } from '../../store/useMacroStore';

function resetStoreConfig() {
  const store = useMacroStore.getState();
  store.setPrefixes(['::']);
  store.setUseCommitKeys(false);
  store.setLanguage('en');
  store.setColorTheme('humo');
}

describe('OptionsCoordinator (store bridge)', () => {
  let coordinator: OptionsCoordinator;

  beforeEach(() => {
    resetStoreConfig();
    coordinator = createOptionsCoordinator(createOptionsManager(), createDefaultOptionsActions());
  });

  afterEach(() => {
    coordinator.destroy();
  });

  describe('seeding', () => {
    it('seeds the manager from the store on creation', () => {
      useMacroStore.getState().setColorTheme('mar');
      useMacroStore.getState().setUseCommitKeys(true);

      const fresh = createOptionsCoordinator(createOptionsManager(), createDefaultOptionsActions());
      const state = fresh.getState();
      expect(state.colorTheme).toBe('mar');
      expect(state.useCommitKeys).toBe(true);
      fresh.destroy();
    });
  });

  describe('local edits', () => {
    it('reflects the change in coordinator state immediately', () => {
      coordinator.setColorTheme('acera');
      expect(coordinator.getState().colorTheme).toBe('acera');
    });

    it('persists the change to the store', () => {
      coordinator.setUseCommitKeys(true);
      expect(useMacroStore.getState().config.useCommitKeys).toBe(true);
    });

    it('writes only the changed field, leaving others intact', () => {
      coordinator.setColorTheme('mar');
      const config = useMacroStore.getState().config;
      expect(config.colorTheme).toBe('mar');
      expect(config.prefixes).toEqual(['::']);
      expect(config.useCommitKeys).toBe(false);
      expect(config.language).toBe('en');
    });

    it('notifies subscribers exactly once per edit (no echo bounce)', () => {
      const cb = vi.fn();
      coordinator.subscribe(cb);
      cb.mockClear();

      coordinator.setColorTheme('mar');

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(expect.objectContaining({ colorTheme: 'mar' }));
    });

    it('does not write when disabled', () => {
      coordinator.disable();
      coordinator.setColorTheme('acera');
      expect(useMacroStore.getState().config.colorTheme).toBe('humo');
      expect(coordinator.getState().colorTheme).toBe('humo');
    });

    it('persists through the injected actions seam, not the store directly', () => {
      const actions: OptionsActions = {
        onPrefixesChanged: vi.fn(),
        onUseCommitKeysChanged: vi.fn(),
        onLanguageChanged: vi.fn(),
        onColorThemeChanged: vi.fn(),
      };
      const c = createOptionsCoordinator(createOptionsManager(), actions);

      c.setColorTheme('mar');
      c.setUseCommitKeys(true);
      c.setLanguage('es');
      c.setPrefixes(['/']);

      expect(actions.onColorThemeChanged).toHaveBeenCalledWith('mar');
      expect(actions.onUseCommitKeysChanged).toHaveBeenCalledWith(true);
      expect(actions.onLanguageChanged).toHaveBeenCalledWith('es');
      expect(actions.onPrefixesChanged).toHaveBeenCalledWith(['/']);
      // Coordinator state reflects the change even though the (mock) action
      // never touched the store.
      expect(c.getState().colorTheme).toBe('mar');
      c.destroy();
    });
  });

  describe('external store changes', () => {
    it('propagates an external change to subscribers', () => {
      const cb = vi.fn();
      coordinator.subscribe(cb);
      cb.mockClear();

      // Simulate a change from another context (e.g. the popup)
      useMacroStore.getState().setLanguage('es');

      expect(cb).toHaveBeenCalledWith(expect.objectContaining({ language: 'es' }));
      expect(coordinator.getState().language).toBe('es');
    });
  });

  describe('destroy', () => {
    it('stops responding to store changes after destroy', () => {
      const cb = vi.fn();
      coordinator.subscribe(cb);
      coordinator.destroy();
      cb.mockClear();

      useMacroStore.getState().setColorTheme('acera');

      expect(cb).not.toHaveBeenCalled();
    });
  });
});
