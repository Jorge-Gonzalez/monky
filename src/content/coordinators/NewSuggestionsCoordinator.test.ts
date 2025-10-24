import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNewSuggestionsCoordinator } from './NewSuggestionsCoordinator';
import { NewSuggestionsOverlayManager } from '../overlays/newSuggestionsOverlay/NewSuggestionsOverlayManager';

describe('NewSuggestionsCoordinator', () => {
  let mockManager: NewSuggestionsOverlayManager;
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
    mockActions = createNewSuggestionsCoordinator(mockManager);
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
      test('shows suggestions with buffer and provided coordinates', () => {
        mockActions.onDetectionStarted('test', { x: 200, y: 300 });

        expect(mockManager.show).toHaveBeenCalledWith('test', 200, 300);
      });

      test('shows suggestions with default coordinates (0,0) when position is not provided', () => {
        mockActions.onDetectionStarted('test');

        expect(mockManager.show).toHaveBeenCalledWith('test', 0, 0); // default coordinates
      });
    });

    describe('onDetectionUpdated', () => {
      test('does not update when manager is not visible', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(false);
        
        mockActions.onDetectionUpdated('updated', { x: 250, y: 350 });

        expect(mockManager.show).not.toHaveBeenCalled();
      });

      test('updates suggestions when manager is visible with provided coordinates', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(true);
        
        mockActions.onDetectionUpdated('updated', { x: 250, y: 350 });

        expect(mockManager.show).toHaveBeenCalledWith('updated', 250, 350);
      });

      test('updates suggestions when manager is visible with default coordinates (0,0) when position is not provided', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(true);
        
        mockActions.onDetectionUpdated('updated');

        expect(mockManager.show).toHaveBeenCalledWith('updated', 0, 0); // default coordinates
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

      test('returns false when manager is visible', () => {
        vi.mocked(mockManager.isVisible).mockReturnValue(true);
        
        const result = mockActions.onCommitRequested('buffer');

        expect(result).toBe(false);
      });
    });

    describe('onNavigationRequested', () => {
      test('returns false to allow other handlers to process', () => {
        const result = mockActions.onNavigationRequested('up');
        expect(result).toBe(false);

        const result2 = mockActions.onNavigationRequested('down');
        expect(result2).toBe(false);
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