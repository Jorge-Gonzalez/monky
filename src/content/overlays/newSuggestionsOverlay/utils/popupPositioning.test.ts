import { calculateOptimalPosition, PopupPositionResult } from './popupPositioning';

describe('Popup Positioning', () => {
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

    // When centered, the popup would be from x=0 to x=200, which is within window bounds
    expect(result.x).toBe(10); // constrained to left margin since centered position would be at 0
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

  test('constrains x position to window boundaries when centered position would overflow', () => {
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

    // Should be constrained to the margin on the left
    expect(result.x).toBe(10); // left margin
    expect(result.placement).toBe('bottom');
  });

  test('constrains x position to window boundaries when centered position would overflow right', () => {
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

    // Should be positioned so right edge is at window width - margin
    expect(result.x).toBe(800 - 200 - 10); // window width - popup width - right margin
    expect(result.placement).toBe('bottom');
  });

  test('constrains y position when neither above nor below has enough space', () => {
    const cursorPosition = { x: 400, y: 550 }; // near bottom
    const windowSize = { width: 800, height: 600 };
    const popupDimensions = { width: 200, height: 200 }; // very tall popup
    const boundarySettings = { margin: 10 };

    const result = calculateOptimalPosition(
      cursorPosition,
      windowSize,
      popupDimensions,
      boundarySettings
    );

    // When below: y = 550 + 8 = 558, bottom = 558 + 200 = 758 > 590 (window - margin), so won't work
    // When above: y = 550 - 200 - 8 = 342, which is > 10 (margin), so this works
    expect(result.y).toBe(550 - 200 - 8); // positioned above cursor
    expect(result.placement).toBe('top');
  });

  test('handles cursor at exact center of window', () => {
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

    expect(result.x).toBe(400 - 100); // centered on cursor
    expect(result.y).toBe(300 + 8); // below cursor
    expect(result.placement).toBe('bottom');
  });
});