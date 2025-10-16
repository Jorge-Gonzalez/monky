import { EditableEl } from '../../../../types';

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
  div.style.overflow = 'hidden'; // Prevent scrollbars in mirror

  properties.forEach((prop) => {
    div.style[prop as any] = style[prop as any];
  });

  document.body.appendChild(div);

  // Get text before caret
  const textBeforeCaret = element.value.substring(0, position);
  
  // For multiline support, we need to preserve newlines
  const textNode = document.createTextNode(textBeforeCaret);
  div.appendChild(textNode);

  // Create a span for measuring the exact caret position
  const span = document.createElement('span');
  span.textContent = '|'; // Use a visible character for measurement
  div.appendChild(span);

  // Get the span's position relative to the mirror div
  const spanRect = span.getBoundingClientRect();
  const divRect = div.getBoundingClientRect();
  
  // Calculate position relative to mirror div
  const relativeX = spanRect.left - divRect.left;
  const relativeY = spanRect.top - divRect.top;

  // Get element's position on page
  const elementRect = element.getBoundingClientRect();

  // Get the element's border and padding
  const borderLeft = parseInt(style.borderLeftWidth) || 0;
  const borderTop = parseInt(style.borderTopWidth) || 0;
  const paddingLeft = parseInt(style.paddingLeft) || 0;
  const paddingTop = parseInt(style.paddingTop) || 0;

  // Calculate final coordinates
  const coordinates: CaretCoordinates = {
    x: elementRect.left + window.scrollX + borderLeft + paddingLeft + relativeX - element.scrollLeft,
    y: elementRect.top + window.scrollY + borderTop + paddingTop + relativeY - element.scrollTop + spanRect.height,
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
  
  // Clone the range to avoid modifying the actual selection
  const clonedRange = range.cloneRange();
  clonedRange.collapse(true); // Collapse to start (caret position)
  
  // Insert a temporary span at the caret position to get precise coordinates
  const span = document.createElement('span');
  span.textContent = '\u200B'; // Zero-width space
  clonedRange.insertNode(span);
  
  const rect = span.getBoundingClientRect();
  
  const coordinates: CaretCoordinates = {
    x: rect.left + window.scrollX,
    y: rect.bottom + window.scrollY,
  };
  
  // Remove the temporary span
  span.parentNode?.removeChild(span);
  
  // Normalize the container to merge any split text nodes
  if (range.startContainer.parentElement) {
    range.startContainer.parentElement.normalize();
  }

  return coordinates;
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
    console.log('Scroll position:', { scrollLeft: element.scrollLeft, scrollTop: element.scrollTop });
  }

  const coords = getCaretCoordinates(element);
  console.log('Calculated coordinates:', coords);
  
  if (coords) {
    console.log('Viewport position:', {
      x: coords.x - window.scrollX,
      y: coords.y - window.scrollY,
    });
    console.log('Element rect:', element.getBoundingClientRect());
  }
  
  console.groupEnd();
  
  return coords;
}