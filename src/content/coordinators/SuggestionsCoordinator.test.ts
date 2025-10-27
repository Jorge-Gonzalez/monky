import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSuggestionsCoordinator } from './SuggestionsCoordinator';
import { SuggestionsOverlayManager } from '../overlays/suggestionsOverlay/SuggestionsOverlayManager';

describe('SuggestionsCoordinator', () => {
  let mockManager: SuggestionsOverlayManager;
  let mockActions: any;

  beforeEach(() => {
    // Create mock manager
    mockManager = {
      show: vi.fn(),
      showAll: vi.fn(),
      hide: vi.fn(),
      isVisible: vi.fn(() => false),
      updateMacros: vi.fn(),
      destroy: vi.fn(),
    };

    // Create the coordinator
    mockActions = createSuggestionsCoordinator(mockManager);
  });

  describe('Initialization', () => {
    test('creates coordinator that implements DetectorActions', () => {
      expect(mockActions).toBeDefined();
      expect(typeof mockActions.onDetectionStarted).toBe('function');
      expect(typeof mockActions.onDetectionUpdated).toBe('function');
      expect(typeof mockActions.onDetectionCancelled).toBe('function');
      expect(typeof mockActions.onShowAllRequested).toBe('function');
    });

    test('coordinator is enabled by default', () => {
      expect(mockActions.isEnabled()).toBe(true);
    });
  });

  describe('Detector Actions Interface', () => {
    describe('onDetectionStarted', () => {
      test('saves buffer but does not show suggestions automatically', () => {
        mockActions.onDetectionStarted('test', { x: 200, y: 300 });

        // Should not auto-show on detection start (only on Tab key)
        expect(mockManager.show).not.toHaveBeenCalled();
      });

      test('saves buffer without position', () => {
        mockActions.onDetectionStarted('test');

        // Should not auto-show on detection start
        expect(mockManager.show).not.toHaveBeenCalled();
      });
    });

    describe('onDetectionUpdated', () => {
      test('saves updated buffer but does not auto-show suggestions', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(false);
        
        mockActions.onDetectionUpdated('updated', { x: 250, y: 350 });

        expect(mockManager.show).not.toHaveBeenCalled();
      });

      test('saves buffer and does not auto-update when manager is visible', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(true);
        
        mockActions.onDetectionUpdated('updated', { x: 250, y: 350 });

        // Should not auto-update (disabled feature - only Tab key shows suggestions)
        expect(mockManager.show).not.toHaveBeenCalled();
      });

      test('saves buffer without triggering overlay when no position provided', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(true);
        
        mockActions.onDetectionUpdated('updated');

        // Should not auto-show (only Tab key triggers overlay)
        expect(mockManager.show).not.toHaveBeenCalled();
      });
    });

    describe('onDetectionCancelled', () => {
      test('hides suggestions when detection is cancelled', () => {
        mockActions.onDetectionCancelled();

        expect(mockManager.hide).toHaveBeenCalled();
      });
    });

    describe('onShowAllRequested', () => {
      test('shows all suggestions with provided coordinates', () => {
        mockActions.onShowAllRequested('context', { x: 400, y: 500 });

        expect(mockManager.showAll).toHaveBeenCalledWith(400, 500, 'context');
      });

      test('shows all suggestions with default coordinates (0,0) when position is not provided', () => {
        mockActions.onShowAllRequested('context');

        expect(mockManager.showAll).toHaveBeenCalledWith(0, 0, 'context'); // default coordinates and buffer
      });
    });

    describe('onMacroCommitted', () => {
      test('hides suggestions when macro is committed', () => {
        mockActions.onMacroCommitted('macro-id');

        expect(mockManager.hide).toHaveBeenCalled();
      });
    });

    describe('onCommitRequested', () => {
      test('returns false when manager is not visible', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(false);
        
        const result = mockActions.onCommitRequested('buffer');

        expect(result).toBe(false);
      });

      test('returns true when manager is visible (to let overlay handle selection)', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(true);

        const result = mockActions.onCommitRequested('buffer');

        expect(result).toBe(true);
      });
    });

    describe('onNavigationRequested', () => {
      test('returns false when manager is not visible', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(false);
        
        const result = mockActions.onNavigationRequested('up');
        expect(result).toBe(false);

        const result2 = mockActions.onNavigationRequested('down');
        expect(result2).toBe(false);
      });

      test('returns true when manager is visible to handle navigation', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(true);
        
        const result = mockActions.onNavigationRequested('left');
        expect(result).toBe(true);

        const result2 = mockActions.onNavigationRequested('right');
        expect(result2).toBe(true);
      });
    });

    describe('onCancelRequested', () => {
      test('returns false when manager is not visible', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(false);
        
        const result = mockActions.onCancelRequested();

        expect(result).toBe(false);
        expect(mockManager.hide).not.toHaveBeenCalled();
      });

      test('hides suggestions and returns true when manager is visible', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(true);
        
        const result = mockActions.onCancelRequested();

        expect(mockManager.hide).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });
  });

  describe('Coordinator Management', () => {
    describe('attach/detach', () => {
      test('attaches click outside listener', () => {
        const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
        
        mockActions.attach();
        
        expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
        
        addEventListenerSpy.mockRestore();
      });

      test('detaches click outside listener', () => {
        const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
        
        mockActions.attach();
        mockActions.detach();
        
        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
        
        removeEventListenerSpy.mockRestore();
      });

      test('hides suggestions when detaching', () => {
        mockActions.detach();
        
        expect(mockManager.hide).toHaveBeenCalled();
      });
    });

    describe('enable/disable', () => {
      test('enables coordinator', () => {
        mockActions.disable();
        expect(mockActions.isEnabled()).toBe(false);
        
        mockActions.enable();
        expect(mockActions.isEnabled()).toBe(true);
      });

      test('disables coordinator', () => {
        mockActions.enable();
        expect(mockActions.isEnabled()).toBe(true);
        
        mockActions.disable();
        expect(mockActions.isEnabled()).toBe(false);
      });

      test('hides suggestions when disabling', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(true);
        
        mockActions.disable();
        
        expect(mockManager.hide).toHaveBeenCalled();
      });

      test('updateConfig is a no-op function', () => {
        expect(() => mockActions.updateConfig()).not.toThrow();
        // Should not affect the manager or throw an error
      });
    });
  });

  describe('Macro Management', () => {
    test('setMacros updates both internal state and manager', () => {
      const macros = [
        { id: '1', command: '/test', text: 'Test macro' },
        { id: '2', command: '/hello', text: 'Hello world' }
      ];
      
      mockActions.setMacros(macros);
      
      expect(mockManager.updateMacros).toHaveBeenCalledWith(macros);
    });
  });
});