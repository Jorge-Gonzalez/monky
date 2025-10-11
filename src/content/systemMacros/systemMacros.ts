import { Macro } from "../../types"
import { searchOverlayManager, newSuggestionsOverlayManager } from "../overlays";

/**
 * System macros for keyboard shortcuts and special functionality.
 * These are built-in macros that provide keyboard-first features.
 */
export const SYSTEM_MACROS: Macro[] = [
  {
    id: 'system-search-overlay',
    command: '/?',
    text: '', // No replacement text - this triggers an action
    isSystemMacro: true,
    description: 'Open macro search overlay'
  },
  {
    id: 'system-help',
    command: '/help',
    text: '', // No replacement text - this triggers an action
    isSystemMacro: true,
    description: 'Show keyboard shortcuts help'
  },
  {
    id: 'system-list-macros',
    command: '/macros',
    text: '', // No replacement text - this triggers an action
    isSystemMacro: true,
    description: 'List all available macros'
  },
  {
    id: 'system-toggle-new-suggestions',
    command: '/>',
    text: '', // No replacement text - this triggers an action
    isSystemMacro: true,
    description: 'Toggle new suggestions overlay visibility'
  }
]

/**
 * Checks if a macro is a system macro that should trigger special functionality
 * instead of text replacement.
 */
export function isSystemMacro(macro: Macro): boolean {
  return macro.isSystemMacro === true || SYSTEM_MACROS.some(sm => sm.id === macro.id)
}

/**
 * Handles system macro actions.
 * @param macro The system macro to execute
 * @returns true if the system macro was handled, false otherwise
 */
export function handleSystemMacro(macro: Macro): boolean {
  if (!isSystemMacro(macro)) {
    return false
  }

  switch (macro.id) {
    case 'system-search-overlay':
      showSearchOverlay()
      return true
    
    case 'system-help':
      showKeyboardHelp()
      return true
    
    case 'system-list-macros':
      showMacroList()
      return true
    
    case 'system-toggle-new-suggestions':
      toggleNewSuggestionsOverlay()
      return true
    
    default:
      console.warn('Unknown system macro:', macro.id)
      return false
  }
}

function showSearchOverlay() {
  console.log('🔍 Search overlay triggered!')
  
  // Show the actual search overlay
  searchOverlayManager.show();
}

function showKeyboardHelp() {
  console.log('❓ Keyboard help triggered!')
  
  const helpText = `
Keyboard Shortcuts:
• /? - Open search overlay
• /help - Show this help
• /macros - List all macros
• /> - Toggle new suggestions overlay
• Escape - Close overlays (when implemented)
  `.trim()
  
  const notification = createNotification(
    '⌨️ Keyboard Help', 
    helpText,
    'info'
  )
  
  setTimeout(() => notification.remove(), 5000)
}

function showMacroList() {
  console.log('📋 Macro list triggered!')
  
  const notification = createNotification(
    '📋 System Macros',
    'Available system commands:\n/? /help /macros />',
    'info'
  )
  
  setTimeout(() => notification.remove(), 4000)
}

function createNotification(title: string, message: string, type: 'info' | 'success' | 'warning' = 'info'): HTMLElement {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'info' ? '#2563eb' : type === 'success' ? '#16a34a' : '#d97706'};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 350px;
    z-index: 2147483647;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideInNotification 0.3s ease-out;
  `
  
  const titleEl = document.createElement('div')
  titleEl.style.cssText = 'font-weight: 600; margin-bottom: 8px; font-size: 15px;'
  titleEl.textContent = title
  
  const messageEl = document.createElement('div')
  messageEl.style.cssText = 'line-height: 1.4; white-space: pre-line; opacity: 0.9;'
  messageEl.textContent = message
  
  notification.appendChild(titleEl)
  notification.appendChild(messageEl)
  
  // Add animation styles if not already present
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style')
    style.id = 'notification-styles'
    style.textContent = `
      @keyframes slideInNotification {
        from { 
          transform: translateX(100%) scale(0.9); 
          opacity: 0; 
        }
        to { 
          transform: translateX(0) scale(1); 
          opacity: 1; 
        }
      }
    `
    document.head.appendChild(style)
  }
  
  document.body.appendChild(notification)
  return notification
}

function toggleNewSuggestionsOverlay() {
  console.log('🔄 Toggle new suggestions overlay triggered!')
  
  if (newSuggestionsOverlayManager.isVisible()) {
    newSuggestionsOverlayManager.hide();
    createNotification(
      '🔄 New Suggestions Hidden', 
      'New suggestions overlay has been hidden',
      'info'
    );
  } else {
    // Show all macros with a default position (center-left of viewport)
    const defaultX = Math.max(100, window.innerWidth * 0.2);
    const defaultY = Math.max(100, window.innerHeight * 0.3);
    newSuggestionsOverlayManager.showAll(defaultX, defaultY);
    createNotification(
      '🔄 New Suggestions Visible', 
      'New suggestions overlay is now visible',
      'info'
    );
  }
}