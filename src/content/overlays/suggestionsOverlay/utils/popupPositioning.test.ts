import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateOptimalPosition, PopupPositionResult } from './popupPositioning';

describe('Popup Positioning', () => {
  let originalScrollX: number;
  let originalScrollY: number;

  beforeEach(() => {
    // Save original scroll values
    originalScrollX = window.scrollX;
    originalScrollY = window.scrollY;
  });

  afterEach(() => {
    // Restore original scroll values
    Object.defineProperty(window, 'scrollX', { value: originalScrollX, writable: true });
    Object.defineProperty(window, 'scrollY', { value: originalScrollY, writable: true });
  });

  describe('Basic Positioning (No Scroll)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    });

    test('positions below cursor when space is available', () => {
      const cursorPosition = { x: 100, y: 100 };
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      expect(result.y).toBe(100 + 8); // 8px below cursor
      expect(result.placement).toBe('bottom');
    });

    test('positions above cursor when space below is insufficient', () => {
      const cursorPosition = { x: 100, y: 550 }; // near bottom
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      expect(result.y).toBe(550 - 100 - 8); // above cursor
      expect(result.placement).toBe('top');
    });

    test('centers popup on cursor horizontally', () => {
      const cursorPosition = { x: 400, y: 300 }; // center of 800x600 window
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      expect(result.x).toBe(400 - 100); // centered on cursor (x - width/2)
      expect(result.y).toBe(300 + 8); // below cursor
      expect(result.placement).toBe('bottom');
    });

    test('constrains x position to left boundary', () => {
      const cursorPosition = { x: 50, y: 100 }; // near left edge
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      expect(result.x).toBe(10); // constrained to left margin
      expect(result.placement).toBe('bottom');
    });

    test('constrains x position to right boundary', () => {
      const cursorPosition = { x: 750, y: 100 }; // near right edge
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      expect(result.x).toBe(800 - 200 - 10); // constrained to right
      expect(result.placement).toBe('bottom');
    });
  });

  describe('Scroll Handling', () => {
    test('accounts for horizontal scroll', () => {
      Object.defineProperty(window, 'scrollX', { value: 100, writable: true });
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

      // Cursor is at page position 500 (viewport position 400)
      const cursorPosition = { x: 500, y: 300 };
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      // Should center on viewport position 400.
      // Viewport X is 500 (page) - 100 (scroll) = 400.
      // Centered position is 400 - (200 / 2) = 300.
      expect(result.x).toBe(400 - popupDimensions.width / 2);
    });

    test('accounts for vertical scroll', () => {
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true });

      // Cursor is at page position 500 (viewport position 300)
      const cursorPosition = { x: 400, y: 500 };
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      // Viewport Y: 300 (cursor) + 8 (offset) = 308
      // The result should be in viewport coordinates.
      expect(result.y).toBe(308);
      expect(result.placement).toBe('bottom');
    });

    test('accounts for both horizontal and vertical scroll', () => {
      Object.defineProperty(window, 'scrollX', { value: 150, writable: true });
      Object.defineProperty(window, 'scrollY', { value: 300, writable: true });

      // Cursor at page position (550, 700) -> viewport position (400, 400)
      const cursorPosition = { x: 550, y: 700 };
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      // Viewport position: (400 - 100, 400 + 8) = (300, 408)
      expect(result.x).toBe(300);
      expect(result.y).toBe(408);
      expect(result.placement).toBe('bottom');
    });

    test('positions above cursor when scrolled near bottom of viewport', () => {
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true });

      // Cursor at page position 1050 -> viewport position 550
      const cursorPosition = { x: 400, y: 1050 };
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      // Viewport Y: 550 - 100 (height) - 8 (offset) = 442
      expect(result.y).toBe(442);
      expect(result.placement).toBe('top');
    });

    test('constrains to viewport boundaries even when scrolled', () => {
      Object.defineProperty(window, 'scrollX', { value: 200, writable: true });
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

      // Cursor at page position 250 -> viewport position 50 (near left edge)
      const cursorPosition = { x: 250, y: 300 };
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      // Should be constrained to the left margin in the viewport.
      // Viewport X: 10 (margin)
      expect(result.x).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    test('handles very tall popup that cannot fit above or below', () => {
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

      const cursorPosition = { x: 400, y: 300 };
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 500 }; // very tall
      const boundarySettings = { margin: 10 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions,
        boundarySettings
      );

      // Should constrain to viewport boundaries
      expect(result.y).toBeGreaterThanOrEqual(10); // at least margin
      expect(result.y).toBeLessThanOrEqual(600 - 500 - 10); // at most window - height - margin
    });

    test('uses default margin when not specified', () => {
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

      const cursorPosition = { x: 50, y: 100 };
      const windowSize = { width: 800, height: 600 };
      const popupDimensions = { width: 200, height: 100 };

      const result = calculateOptimalPosition(
        cursorPosition,
        windowSize,
        popupDimensions
        // No boundarySettings - should use default margin of 10
      );

      expect(result.x).toBe(10); // default margin
    });
  });
});