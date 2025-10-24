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

// Refactor: These actions need to be moved to the coordinatiors of their respective overlays.

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
      // toggleNewSuggestionsOverlay()
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
}

function showMacroList() {
  console.log('📋 Macro list triggered!')
}

function toggleNewSuggestionsOverlay() {
  console.log('🔄 Toggle new suggestions overlay triggered!')
  
  if (newSuggestionsOverlayManager.isVisible()) {
    newSuggestionsOverlayManager.hide();
  } else {
    newSuggestionsOverlayManager.showAll();
  }
}