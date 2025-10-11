import { useState, useEffect, useRef } from 'react';

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
    const aboveY = cursorPosition.y - popupDimensions.height - 8; // 8px offset above cursor
    
    if (aboveY >= margin) {
      // Position above cursor
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
  
  return { x, y, placement };
}

/**
 * Hook to handle positioning of a popup element
 * @param isVisible Whether the popup is visible
 * @param cursorPosition Current cursor position
 * @param popupRef Reference to the popup element
 * @returns Position and placement information
 */
export function usePopupPosition(
  isVisible: boolean,
  cursorPosition: PopupPosition | null,
  popupRef: React.RefObject<HTMLElement>,
  boundarySettings?: BoundarySettings
) {
  const [position, setPosition] = useState<PopupPositionResult | null>(null);
  
  useEffect(() => {
    if (!isVisible || !cursorPosition || !popupRef.current) {
      setPosition(null);
      return;
    }
    
    // Get popup dimensions
    const popupEl = popupRef.current;
    const rect = popupEl.getBoundingClientRect();
    const dimensions: PopupDimensions = {
      width: rect.width,
      height: rect.height
    };
    
    // Get window dimensions
    const windowSize: WindowSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Calculate optimal position
    const newPosition = calculateOptimalPosition(
      cursorPosition,
      windowSize,
      dimensions,
      boundarySettings
    );
    
    setPosition(newPosition);
  }, [isVisible, cursorPosition, boundarySettings]);
  
  return position;
}