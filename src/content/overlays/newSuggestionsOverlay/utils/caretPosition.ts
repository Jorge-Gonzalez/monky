import { EditableEl } from '../../../types';

export interface CaretCoordinates {
  x: number;
  y: number;
}

/**
 * Gets the pixel coordinates of the caret/cursor in an input or textarea element
 */
function getInputCaretCoordinates(
  element: HTMLInputElement | HTMLTextAreaElement
): CaretCoordinates {
  const position = element.selectionStart || 0;
  
  // Create a mirror div to measure text
  const div = document.createElement('div');
  const style = window.getComputedStyle(element);
  
  // Copy all relevant styles
  const properties = [
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'whiteSpace',
    'wordBreak',
    'wordWrap',
  ];

  // Apply styles to mirror div
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.top = '0';
  div.style.left = '0';

  properties.forEach((prop) => {
    div.style[prop as any] = style[prop as any];
  });

  document.body.appendChild(div);

  // Get text before caret
  const textBeforeCaret = element.value.substring(0, position);
  div.textContent = textBeforeCaret;

  // Create a span for the caret position
  const span = document.createElement('span');
  span.textContent = element.value.substring(position, position + 1) || '.';
  div.appendChild(span);

  // Get element's position on page
  const elementRect = element.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();

  // Calculate coordinates
  const coordinates: CaretCoordinates = {
    x: elementRect.left + window.scrollX + (spanRect.left - elementRect.left) - element.scrollLeft,
    y: elementRect.top + window.scrollY + (spanRect.top - elementRect.top) - element.scrollTop + spanRect.height,
  };

  // Cleanup
  document.body.removeChild(div);

  return coordinates;
}

/**
 * Gets the pixel coordinates of the caret in a contentEditable element
 */
function getContentEditableCaretCoordinates(): CaretCoordinates | null {
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // If rect has no dimensions, try to get them from the container
  if (rect.width === 0 && rect.height === 0) {
    const container = range.startContainer;
    if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
      const parentRect = container.parentElement.getBoundingClientRect();
      return {
        x: parentRect.left + window.scrollX,
        y: parentRect.bottom + window.scrollY,
      };
    }
  }

  return {
    x: rect.left + window.scrollX,
    y: rect.bottom + window.scrollY,
  };
}

/**
 * Main function to get caret coordinates for any supported element type
 */
export function getCaretCoordinates(element: EditableEl): CaretCoordinates | null {
  try {
    // Handle input and textarea elements
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return getInputCaretCoordinates(element);
    }

    // Handle contentEditable elements
    if (element.hasAttribute('contenteditable') || 
        element.getAttribute('contenteditable') === 'true') {
      return getContentEditableCaretCoordinates();
    }

    // Fallback to center of element
    console.warn('Unknown element type, using fallback position');
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + rect.height / 2 + window.scrollY,
    };
  } catch (error) {
    console.error('Error getting caret coordinates:', error);
    return null;
  }
}

/**
 * Gets caret coordinates with debug logging
 */
export function getCaretCoordinatesDebug(element: EditableEl): CaretCoordinates | null {
  console.group('🔍 Getting Caret Coordinates');
  console.log('Element:', element);
  console.log('Element type:', element.constructor.name);
  console.log('Is input/textarea:', element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement);
  console.log('Is contentEditable:', element.hasAttribute('contenteditable'));
  
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    console.log('Selection start:', element.selectionStart);
    console.log('Selection end:', element.selectionEnd);
    console.log('Value length:', element.value.length);
  }

  const coords = getCaretCoordinates(element);
  console.log('Calculated coordinates:', coords);
  
  if (coords) {
    console.log('Viewport position:', {
      x: coords.x - window.scrollX,
      y: coords.y - window.scrollY,
    });
  }
  
  console.groupEnd();
  
  return coords;
}