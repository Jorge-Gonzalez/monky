interface PopupPosition {
  x: number;
  y: number;
}

interface WindowSize {
  width: number;
  height: number;
}

interface PopupDimensions {
  width: number;
  height: number;
}

interface BoundarySettings {
  margin: number;
}

export interface PopupPositionResult {
  x: number;
  y: number;
  placement: 'top' | 'bottom';
}

/**
 * Calculates optimal position for a popup to stay within window boundaries
 * 
 * IMPORTANT: Expects cursorPosition in PAGE coordinates (includes scroll: window.scrollX/Y)
 * Returns position in PAGE coordinates for use with position: fixed
 * 
 * @param cursorPosition Current cursor position in page coordinates (pageX, pageY)
 * @param windowSize Current window dimensions (viewport)
 * @param popupDimensions Dimensions of the popup element
 * @param boundarySettings Margin settings
 * @returns Optimal position and placement direction in page coordinates
 */
export function calculateOptimalPosition(
  cursorPosition: PopupPosition,
  windowSize: WindowSize,
  popupDimensions: PopupDimensions,
  boundarySettings: BoundarySettings = { margin: 10 }
): PopupPositionResult {
  const { margin } = boundarySettings;

  // Convert page coordinates to viewport coordinates
  const viewportX = cursorPosition.x - window.scrollX;
  const viewportY = cursorPosition.y - window.scrollY;

  // Try positioning below the cursor first
  let finalViewportY = viewportY + 8; // 8px offset below cursor
  let placement: 'top' | 'bottom' = 'bottom';

  // Check if popup would go off the bottom of the viewport
  if (finalViewportY + popupDimensions.height > windowSize.height - margin) {
    // Try positioning above the cursor
    const aboveY = viewportY - popupDimensions.height - 8; // 8px offset above cursor
    if (aboveY >= margin) {
      // Position above cursor
      finalViewportY = aboveY;
      placement = 'top';
    } else {
      // Neither position works perfectly, prefer positioning below
      // but constrain to viewport boundaries
      finalViewportY = Math.max(
        margin, 
        Math.min(viewportY + 8, windowSize.height - popupDimensions.height - margin)
      );
    }
  }

  // Calculate x position in viewport, centering on cursor if possible
  let finalViewportX = Math.max(margin, viewportX - popupDimensions.width / 2);

  // Ensure popup stays within left/right boundaries
  if (finalViewportX + popupDimensions.width > windowSize.width - margin) {
    finalViewportX = windowSize.width - popupDimensions.width - margin;
  }
  console.log(`Viewport position: (${viewportX}, ${viewportY})`);
  console.log(`Page position: (${cursorPosition.x}, ${cursorPosition.y})`);
  console.log(`Popup dimensions: (${popupDimensions.width}, ${popupDimensions.height})`);
  console.log(`Window scroll: (${window.scrollX}, ${window.scrollY})`);
  console.log(`Popup positioned at (${finalViewportX}, ${finalViewportY}) with placement: ${placement}`);

  // For `position: fixed`, coordinates are relative to the viewport.
  // We've already calculated these as finalViewportX and finalViewportY.
  return { x: finalViewportX, y: finalViewportY, placement };
}
