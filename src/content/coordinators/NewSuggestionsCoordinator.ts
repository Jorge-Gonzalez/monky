import { EditableEl } from '../../types';
import { NewSuggestionsOverlayManager } from '../overlays/newSuggestionsOverlay/NewSuggestionsOverlayManager';
import { getActiveEditable } from '../detector/editableUtils';

interface CoordinatorConfig {
  triggerChar: string;
  minBufferLength: number;
  showAllShortcut?: {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
}

const DEFAULT_CONFIG: CoordinatorConfig = {
  triggerChar: '/',
  minBufferLength: 1,
  showAllShortcut: {
    key: ' ', // Space
    ctrl: true,
  },
};

export function createNewSuggestionsCoordinator(
  manager: NewSuggestionsOverlayManager,
  config: Partial<CoordinatorConfig> = {}
) {
  const settings = { ...DEFAULT_CONFIG, ...config };
  let isEnabled = true;
  let lastBuffer = '';

  /**
   * Extract the buffer text after the trigger character
   */
  const getBufferText = (element: EditableEl): string | null => {
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

    // Find the last trigger character before cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const triggerIndex = textBeforeCursor.lastIndexOf(settings.triggerChar);

    if (triggerIndex === -1) {
      return null;
    }

    // Get text between trigger and cursor
    const buffer = textBeforeCursor.substring(triggerIndex + 1);

    // Don't show if buffer contains spaces (optional - adjust to your needs)
    if (buffer.includes(' ') || buffer.includes('\n')) {
      return null;
    }

    // Check minimum buffer length
    if (buffer.length < settings.minBufferLength) {
      return null;
    }

    return buffer;
  };

  /**
   * Handle input events
   */
  const handleInput = (e: Event): void => {
    if (!isEnabled) return;

    const target = e.target;
    if (!target) return;

    const element = getActiveEditable(target);
    if (!element) return;

    const buffer = getBufferText(element);

    if (buffer !== null && buffer !== lastBuffer) {
      // Buffer changed, show/update suggestions
      lastBuffer = buffer;
      manager.show(buffer);
    } else if (buffer === null && manager.isVisible()) {
      // No valid buffer, hide if visible
      lastBuffer = '';
      manager.hide();
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: KeyboardEvent): void => {
    if (!isEnabled) return;

    // Check for showAll shortcut (e.g., Ctrl+Space)
    if (settings.showAllShortcut) {
      const { key, ctrl, alt, shift } = settings.showAllShortcut;
      
      const ctrlMatch = ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const altMatch = alt ? e.altKey : !e.altKey;
      const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
      const keyMatch = e.key === key || e.code === key;

      if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
        e.preventDefault();
        
        const element = getActiveEditable(document.activeElement);
        if (element) {
          manager.showAll();
        }
        return;
      }
    }

    // Handle Escape to close
    if (e.key === 'Escape' && manager.isVisible()) {
      e.preventDefault();
      manager.hide();
      return;
    }

    // Handle backspace - update buffer
    if (e.key === 'Backspace') {
      // Let the input event handler deal with it
      return;
    }
  };

  /**
   * Handle click outside to close
   */
  const handleClickOutside = (e: MouseEvent): void => {
    if (!manager.isVisible()) return;

    // Check if click was inside an editable element
    const target = e.target as Element;
    const editableElement = getActiveEditable(target);
    
    if (!editableElement) {
      manager.hide();
    }
  };

  /**
   * Handle blur events
   */
  const handleBlur = (e: FocusEvent): void => {
    if (!manager.isVisible()) return;

    // Small delay to allow clicking on suggestions
    setTimeout(() => {
      // Check if focus moved to another editable element
      const newElement = getActiveEditable(document.activeElement);
      if (!newElement) {
        manager.hide();
        lastBuffer = '';
      }
    }, 200);
  };

  /**
   * Start listening to events
   */
  const attach = (): void => {
    // Use capture phase to ensure we catch events before other handlers
    document.addEventListener('input', handleInput, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('blur', handleBlur, true);
  };

  /**
   * Stop listening to events
   */
  const detach = (): void => {
    document.removeEventListener('input', handleInput, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    document.removeEventListener('click', handleClickOutside, true);
    document.removeEventListener('blur', handleBlur, true);
  };

  /**
   * Enable the coordinator
   */
  const enable = (): void => {
    isEnabled = true;
  };

  /**
   * Disable the coordinator
   */
  const disable = (): void => {
    isEnabled = false;
    if (manager.isVisible()) {
      manager.hide();
    }
    lastBuffer = '';
  };

  /**
   * Check if coordinator is enabled
   */
  const getEnabled = (): boolean => isEnabled;

  /**
   * Update configuration
   */
  const updateConfig = (newConfig: Partial<CoordinatorConfig>): void => {
    Object.assign(settings, newConfig);
  };

  return {
    attach,
    detach,
    enable,
    disable,
    isEnabled: getEnabled,
    updateConfig,
  };
}

export interface NewSuggestionsCoordinator {
  attach: () => void;
  detach: () => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
  updateConfig: (config: Partial<CoordinatorConfig>) => void;
}