import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSearchCoordinator, SearchCoordinator } from './SearchCoordinator';
import { SearchOverlayManager } from '../overlays/searchOverlay/searchOverlayManager';
import { Macro, EditableEl } from '../../types';

describe('SearchCoordinator', () => {
  let mockManager: SearchOverlayManager;
  let coordinator: SearchCoordinator;

  beforeEach(() => {
    // Create mock manager
    mockManager = {
      show: vi.fn(),
      hide: vi.fn(),
      isVisible: vi.fn(() => false),
      destroy: vi.fn(),
      setOnMacroSelected: vi.fn(),
    };

    coordinator = createSearchCoordinator(mockManager);
  });

  describe('Basic Operations', () => {
    it('should initialize with enabled state', () => {
      expect(coordinator.isEnabled()).toBe(true);
    });

    it('should show overlay when enabled', () => {
      coordinator.show(100, 200);
      expect(mockManager.show).toHaveBeenCalledWith(100, 200);
    });

    it('should hide overlay', () => {
      coordinator.hide();
      expect(mockManager.hide).toHaveBeenCalled();
    });

    it('should check visibility status', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      expect(coordinator.isVisible()).toBe(true);

      vi.mocked(mockManager.isVisible).mockReturnValue(false);
      expect(coordinator.isVisible()).toBe(false);
    });

    it('should set macro selection callback', () => {
      const callback = vi.fn();
      coordinator.setOnMacroSelected(callback);
      expect(mockManager.setOnMacroSelected).toHaveBeenCalledWith(callback);
    });
  });

  describe('Enable/Disable', () => {
    it('should not show overlay when disabled', () => {
      coordinator.disable();
      coordinator.show(100, 200);
      expect(mockManager.show).not.toHaveBeenCalled();
    });

    it('should hide overlay when disabling', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      coordinator.disable();
      expect(mockManager.hide).toHaveBeenCalled();
    });

    it('should show overlay after re-enabling', () => {
      coordinator.disable();
      coordinator.enable();
      coordinator.show(100, 200);
      expect(mockManager.show).toHaveBeenCalledWith(100, 200);
    });

    it('should return enabled state', () => {
      expect(coordinator.isEnabled()).toBe(true);
      coordinator.disable();
      expect(coordinator.isEnabled()).toBe(false);
      coordinator.enable();
      expect(coordinator.isEnabled()).toBe(true);
    });
  });

  describe('Attach/Detach', () => {
    it('should attach event listeners', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      coordinator.attach();

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    });

    it('should detach event listeners and hide overlay', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      coordinator.attach();
      coordinator.detach();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
      expect(mockManager.hide).toHaveBeenCalled();
    });
  });

  describe('Click Outside Handling', () => {
    it('should hide overlay when clicking outside', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      coordinator.attach();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: document.body });

      document.dispatchEvent(clickEvent);
      expect(mockManager.hide).toHaveBeenCalled();
    });

    it('should not hide overlay when clicking inside overlay element', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      coordinator.attach();

      const overlayElement = document.createElement('div');
      overlayElement.id = 'macro-search-overlay';
      document.body.appendChild(overlayElement);

      const innerElement = document.createElement('div');
      overlayElement.appendChild(innerElement);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: innerElement });

      document.dispatchEvent(clickEvent);
      expect(mockManager.hide).not.toHaveBeenCalled();

      overlayElement.remove();
    });

    it('should not process clicks when overlay is not visible', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(false);
      coordinator.attach();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: document.body });

      document.dispatchEvent(clickEvent);
      expect(mockManager.hide).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key Handling', () => {
    it('should hide overlay on Escape key', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      coordinator.attach();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy = vi.spyOn(escapeEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(escapeEvent, 'stopPropagation');

      document.dispatchEvent(escapeEvent);

      expect(mockManager.hide).toHaveBeenCalled();
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should not process Escape when overlay is not visible', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(false);
      coordinator.attach();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      document.dispatchEvent(escapeEvent);
      expect(mockManager.hide).not.toHaveBeenCalled();
    });

    it('should not process other keys', () => {
      vi.mocked(mockManager.isVisible).mockReturnValue(true);
      coordinator.attach();

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      document.dispatchEvent(enterEvent);
      expect(mockManager.hide).not.toHaveBeenCalled();
    });
  });

  describe('Destroy', () => {
    it('should detach and destroy manager', () => {
      coordinator.attach();
      coordinator.destroy();

      expect(mockManager.hide).toHaveBeenCalled();
      expect(mockManager.destroy).toHaveBeenCalled();
    });
  });
});
