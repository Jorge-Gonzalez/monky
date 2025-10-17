import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNewSuggestionsCoordinator } from './NewSuggestionsCoordinator';
import { NewSuggestionsOverlayManager } from '../overlays/newSuggestionsOverlay/NewSuggestionsOverlayManager';

// Mock getActiveEditable
vi.mock('../../detector/editableUtils', () => ({
  getActiveEditable: vi.fn((element) => {
    if (element instanceof HTMLInputElement || 
        element instanceof HTMLTextAreaElement ||
        element?.hasAttribute?.('contenteditable')) {
      return element;
    }
    return null;
  }),
}));

describe('NewSuggestionsCoordinator', () => {
  let mockManager: NewSuggestionsOverlayManager;
  let input: HTMLInputElement;

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

    // Create input element
    input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    input.focus();
  });

  afterEach(() => {
    if (input.parentNode) {
      document.body.removeChild(input);
    }
  });

  describe('Initialization', () => {
    test('creates coordinator with default config', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager);

      expect(coordinator).toBeDefined();
      expect(coordinator.isEnabled()).toBe(true);
    });

    test('creates coordinator with custom config', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager, {
        triggerChar: '@',
        minBufferLength: 2,
      });

      expect(coordinator).toBeDefined();
    });
  });

  describe('Event Listening', () => {
    test('attaches event listeners', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const coordinator = createNewSuggestionsCoordinator(mockManager);

      coordinator.attach();

      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function), true);

      addEventListenerSpy.mockRestore();
    });

    test('detaches event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const coordinator = createNewSuggestionsCoordinator(mockManager);

      coordinator.attach();
      coordinator.detach();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function), true);

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Trigger Detection', () => {
    test('shows suggestions when trigger character is typed', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      input.value = '/test';
      input.setSelectionRange(5, 5);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.show).toHaveBeenCalledWith('test');
    });

    test('does not show suggestions without trigger character', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      input.value = 'test';
      input.setSelectionRange(4, 4);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.show).not.toHaveBeenCalled();
    });

    test('respects minimum buffer length', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager, {
        minBufferLength: 2,
      });
      coordinator.attach();

      // Buffer length 1 - should not show
      input.value = '/t';
      input.setSelectionRange(2, 2);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.show).not.toHaveBeenCalled();

      // Buffer length 2 - should show
      input.value = '/te';
      input.setSelectionRange(3, 3);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.show).toHaveBeenCalledWith('te');
    });

    test('ignores buffer with spaces', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      input.value = '/test text';
      input.setSelectionRange(10, 10);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.show).not.toHaveBeenCalled();
    });

    test('uses custom trigger character', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager, {
        triggerChar: '@',
      });
      coordinator.attach();

      input.value = '@test';
      input.setSelectionRange(5, 5);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.show).toHaveBeenCalledWith('test');
    });

    test('hides suggestions when buffer becomes invalid', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      input.value = '/test ';
      input.setSelectionRange(6, 6);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.hide).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('shows all suggestions with Ctrl+Space', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: true,
        bubbles: true,
      });
      
      input.dispatchEvent(event);

      expect(mockManager.showAll).toHaveBeenCalled();
    });

    test('hides suggestions with Escape', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      
      input.dispatchEvent(event);

      expect(mockManager.hide).toHaveBeenCalled();
    });

    test('uses custom keyboard shortcut', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager, {
        showAllShortcut: {
          key: 'k',
          ctrl: true,
          shift: true,
        },
      });
      coordinator.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      
      input.dispatchEvent(event);

      expect(mockManager.showAll).toHaveBeenCalled();
    });
  });

  describe('Enable/Disable', () => {
    test('enables coordinator by default', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager);

      expect(coordinator.isEnabled()).toBe(true);
    });

    test('disables coordinator', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      coordinator.disable();

      expect(coordinator.isEnabled()).toBe(false);

      // Should not respond to events when disabled
      input.value = '/test';
      input.setSelectionRange(5, 5);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.show).not.toHaveBeenCalled();
    });

    test('enables coordinator', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      coordinator.disable();
      coordinator.enable();

      expect(coordinator.isEnabled()).toBe(true);

      // Should respond to events when re-enabled
      input.value = '/test';
      input.setSelectionRange(5, 5);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.show).toHaveBeenCalled();
    });

    test('hides suggestions when disabling', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.disable();

      expect(mockManager.hide).toHaveBeenCalled();
    });
  });

  describe('Configuration Updates', () => {
    test('updates configuration', () => {
      const coordinator = createNewSuggestionsCoordinator(mockManager, {
        triggerChar: '/',
      });
      coordinator.attach();

      coordinator.updateConfig({
        triggerChar: '@',
      });

      // Should use new trigger character
      input.value = '@test';
      input.setSelectionRange(5, 5);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(mockManager.show).toHaveBeenCalledWith('test');
    });
  });

  describe('Click Outside Behavior', () => {
    test('hides suggestions when clicking outside editable', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      const div = document.createElement('div');
      document.body.appendChild(div);

      const event = new MouseEvent('click', { bubbles: true });
      div.dispatchEvent(event);

      expect(mockManager.hide).toHaveBeenCalled();

      document.body.removeChild(div);
    });

    test('does not hide when clicking inside editable', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      
      const coordinator = createNewSuggestionsCoordinator(mockManager);
      coordinator.attach();

      const event = new MouseEvent('click', { bubbles: true });
      input.dispatchEvent(event);

      expect(mockManager.hide).not.toHaveBeenCalled();
    });
  });
});