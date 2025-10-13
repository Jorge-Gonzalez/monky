// Example: How to use the updated manager with automatic caret positioning
// The manager now calculates cursor position automatically when not provided!

import { createNewSuggestionsOverlayManager } from './NewSuggestionsOverlayManager';
import { getActiveEditable } from '../../detector/editableUtils';

// Initialize your manager
const macros = [...]; // your macros
const manager = createNewSuggestionsOverlayManager(macros);

// Example 1: Let the manager calculate position automatically (RECOMMENDED)
document.addEventListener('keyup', (e) => {
  const element = getActiveEditable(document.activeElement);
  if (!element) return;

  const buffer = getBufferText(element); // Your existing function
  
  if (buffer) {
    // No need to pass x, y - manager will calculate it automatically!
    manager.show(buffer);
  } else {
    manager.hide();
  }
});

// Example 2: Still works with explicit coordinates if needed
document.addEventListener('keyup', (e) => {
  const element = getActiveEditable(document.activeElement);
  if (!element) return;

  const buffer = getBufferText(element);
  
  if (buffer) {
    // You can still pass explicit coordinates if you have them
    manager.show(buffer, 100, 200);
  }
});

// Example 3: ShowAll mode - also calculates position automatically
document.addEventListener('keydown', (e) => {
  // Check for your trigger key combo (e.g., Ctrl+Space)
  if (e.ctrlKey && e.code === 'Space') {
    e.preventDefault();
    
    // No coordinates needed - manager will calculate them!
    manager.showAll();
  }
});

// Example 4: Handle input events (for real-time filtering)
let debounceTimer: number;

function handleInput(e: Event) {
  clearTimeout(debounceTimer);
  
  debounceTimer = window.setTimeout(() => {
    const element = e.target as EditableEl;
    const buffer = getBufferText(element);
    
    if (buffer && buffer.length > 0) {
      // Automatic position calculation - just pass the buffer!
      manager.show(buffer);
    } else {
      manager.hide();
    }
  }, 100); // Debounce for 100ms
}

// Attach to all inputs/textareas/contentEditable
document.addEventListener('input', handleInput, true);

// Example 5: Mixed usage - sometimes auto, sometimes manual
function showSuggestions(buffer: string, manualCoords?: { x: number; y: number }) {
  if (manualCoords) {
    // Use manual coordinates when provided
    manager.show(buffer, manualCoords.x, manualCoords.y);
  } else {
    // Let manager calculate automatically
    manager.show(buffer);
  }
}

// Example helper function to get buffer text
function getBufferText(element: EditableEl): string {
  let text = '';
  let cursorPos = 0;
  
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    text = element.value;
    cursorPos = element.selectionStart || 0;
  } else if (element.textContent) {
    text = element.textContent;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPos = range.startOffset;
    }
  }
  
  // Find the last trigger character (e.g., '/')
  const triggerIndex = text.lastIndexOf('/', cursorPos);
  
  if (triggerIndex === -1 || triggerIndex >= cursorPos) {
    return '';
  }
  
  // Get text between trigger and cursor
  const buffer = text.substring(triggerIndex + 1, cursorPos);
  
  // Only return buffer if it doesn't contain spaces (you can adjust this rule)
  if (buffer.includes(' ')) {
    return '';
  }
  
  return buffer;
}

// ✨ NEW BENEFIT: Cleaner code!
// Before: manager.show(buffer, coords.x, coords.y);
// After:  manager.show(buffer);  // ← Much simpler!