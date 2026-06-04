// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createOptionsManager, OptionsManager, DEFAULT_OPTIONS } from './optionsManager';

describe('OptionsManager (pure in-memory model)', () => {
  let manager: OptionsManager;

  beforeEach(() => {
    manager = createOptionsManager();
  });

  describe('initialization', () => {
    it('initializes with DEFAULT_OPTIONS when no initial state is given', () => {
      expect(manager.getState()).toEqual(DEFAULT_OPTIONS);
    });

    it('initializes with a provided initial state', () => {
      const m = createOptionsManager({
        prefixes: ['/', ';'],
        useCommitKeys: true,
        language: 'es',
        colorTheme: 'mar',
      });
      expect(m.getState()).toEqual({
        prefixes: ['/', ';'],
        useCommitKeys: true,
        language: 'es',
        colorTheme: 'mar',
      });
    });

    it('does not share state between instances', () => {
      const a = createOptionsManager();
      const b = createOptionsManager();
      a.setUseCommitKeys(true);
      expect(b.getState().useCommitKeys).toBe(false);
    });
  });

  describe('setters', () => {
    it('updates prefixes', () => {
      manager.setPrefixes(['/', '::', ';']);
      expect(manager.getState().prefixes).toEqual(['/', '::', ';']);
    });

    it('updates useCommitKeys', () => {
      manager.setUseCommitKeys(true);
      expect(manager.getState().useCommitKeys).toBe(true);
    });

    it('updates language', () => {
      manager.setLanguage('es');
      expect(manager.getState().language).toBe('es');
    });

    it('updates colorTheme', () => {
      manager.setColorTheme('acera');
      expect(manager.getState().colorTheme).toBe('acera');
    });

    it('merges partial updates via setState', () => {
      manager.setState({ prefixes: ['/'], useCommitKeys: true });
      const state = manager.getState();
      expect(state.prefixes).toEqual(['/']);
      expect(state.useCommitKeys).toBe(true);
      expect(state.language).toBe('en'); // untouched
    });
  });

  describe('validation', () => {
    it('validates prefixes array', () => {
      expect(manager.validate({ prefixes: ['/', '::'] })).toBe(true);
      expect(manager.validate({ prefixes: [] })).toBe(true);
      expect(manager.validate({ prefixes: 'invalid' as any })).toBe(false);
      expect(manager.validate({ prefixes: ['', '::'] })).toBe(false);
      expect(manager.validate({ prefixes: [123 as any] })).toBe(false);
    });

    it('validates useCommitKeys boolean', () => {
      expect(manager.validate({ useCommitKeys: true })).toBe(true);
      expect(manager.validate({ useCommitKeys: 'invalid' as any })).toBe(false);
      expect(manager.validate({ useCommitKeys: 1 as any })).toBe(false);
    });

    it('does not apply an invalid update', () => {
      manager.setState({ prefixes: 'invalid' as any });
      expect(manager.getState().prefixes).toEqual(DEFAULT_OPTIONS.prefixes);
    });
  });

  describe('subscription', () => {
    it('calls a new subscriber immediately with current state', () => {
      const cb = vi.fn();
      manager.subscribe(cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(expect.objectContaining(DEFAULT_OPTIONS));
    });

    it('notifies subscribers on change', () => {
      const cb = vi.fn();
      manager.subscribe(cb);
      cb.mockClear();
      manager.setUseCommitKeys(true);
      expect(cb).toHaveBeenCalledWith(expect.objectContaining({ useCommitKeys: true }));
    });

    it('does not notify when an invalid update is rejected', () => {
      const cb = vi.fn();
      manager.subscribe(cb);
      cb.mockClear();
      manager.setState({ prefixes: 'invalid' as any });
      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const a = vi.fn();
      const b = vi.fn();
      manager.subscribe(a);
      manager.subscribe(b);
      a.mockClear();
      b.mockClear();
      manager.setColorTheme('mar');
      expect(a).toHaveBeenCalledWith(expect.objectContaining({ colorTheme: 'mar' }));
      expect(b).toHaveBeenCalledWith(expect.objectContaining({ colorTheme: 'mar' }));
    });

    it('unsubscribes correctly', () => {
      const cb = vi.fn();
      const unsubscribe = manager.subscribe(cb);
      cb.mockClear();
      unsubscribe();
      manager.setUseCommitKeys(true);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('removes all subscribers', () => {
      const cb = vi.fn();
      manager.subscribe(cb);
      manager.destroy();
      cb.mockClear();
      manager.setUseCommitKeys(true);
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
