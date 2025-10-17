
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
 * @param cursorPosition Current cursor position
 * @param windowSize Current window dimensions
 * @param popupDimensions Dimensions of the popup element
 * @param boundarySettings Margin settings
 * @returns Optimal position and placement direction
 */
export function calculateOptimalPosition(
  cursorPosition: PopupPosition,
  windowSize: WindowSize,
  popupDimensions: PopupDimensions,
  boundarySettings: BoundarySettings = { margin: 10 }
): PopupPositionResult {
  const { margin } = boundarySettings;

  // Try positioning below the cursor first
  let y = cursorPosition.y + 8; // 8px offset below cursor
  let placement: 'top' | 'bottom' = 'bottom';

  // Check if popup would go off the bottom of the screen
  if (y + popupDimensions.height > windowSize.height - margin) {
    // Try positioning above the cursor
    const aboveY = cursorPosition.y - popupDimensions.height - 78; // 8px offset above cursor
    if (aboveY >= margin) {
      // Position above cursor
      console.log('Position above cursor');
      y = aboveY;
      placement = 'top';
    } else {
      // Neither position works perfectly, prefer positioning below
      // but constrain to window boundaries
      y = Math.max(margin, Math.min(cursorPosition.y + 8, windowSize.height - popupDimensions.height - margin));
    }
  }

  // Calculate x position, centering on cursor if possible
  let x = cursorPosition.x - (popupDimensions.width / 2);

  // Ensure popup stays within left/right boundaries
  if (x < margin) {
    x = margin;
  } else if (x + popupDimensions.width > windowSize.width - margin) {
    x = windowSize.width - popupDimensions.width - margin;
  }

  console.log('Calculated position:', { x, y, placement });

  return { x, y, placement };
}

