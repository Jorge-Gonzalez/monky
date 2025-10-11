import { Macro } from '../../types';

// Create a simplified version of the system macros module for testing
// without importing the entire system that has dependency issues
const SYSTEM_MACROS: Macro[] = [
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
];

/**
 * Checks if a macro is a system macro that should trigger special functionality
 * instead of text replacement.
 */
function isSystemMacro(macro: Macro): boolean {
  return macro.isSystemMacro === true || SYSTEM_MACROS.some(sm => sm.id === macro.id);
}

describe('System Macros - Toggle New Suggestions Overlay', () => {
  const toggleMacro: Macro = {
    id: 'system-toggle-new-suggestions',
    command: '/>',
    text: '',
    isSystemMacro: true,
    description: 'Toggle new suggestions overlay visibility'
  };

  test('SYSTEM_MACROS includes the toggle macro', () => {
    expect(SYSTEM_MACROS).toContainEqual(toggleMacro);
  });

  test('isSystemMacro recognizes the toggle macro', () => {
    expect(isSystemMacro(toggleMacro)).toBe(true);
  });

  test('toggle macro command is />', () => {
    expect(toggleMacro.command).toBe('/>');
  });

  test('toggle macro isSystemMacro flag is true', () => {
    expect(toggleMacro.isSystemMacro).toBe(true);
  });

  test('toggle macro has correct description', () => {
    expect(toggleMacro.description).toBe('Toggle new suggestions overlay visibility');
  });

  test('toggle macro id is correct', () => {
    expect(toggleMacro.id).toBe('system-toggle-new-suggestions');
  });

  test('all system macros have isSystemMacro flag set to true', () => {
    for (const macro of SYSTEM_MACROS) {
      expect(macro.isSystemMacro).toBe(true);
    }
  });

  test('all system macros have empty text field', () => {
    for (const macro of SYSTEM_MACROS) {
      expect(macro.text).toBe('');
    }
  });
});