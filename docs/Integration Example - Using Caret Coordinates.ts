// Example: Complete setup with Coordinator (RECOMMENDED)

import { createNewSuggestionsOverlayManager } from './NewSuggestionsOverlayManager';
import { createNewSuggestionsCoordinator } from './NewSuggestionsCoordinator';

// 1. Get your macros
const macros = [
  { id: '1', command: 'email', text: 'user@example.com', updated_at: Date.now() },
  { id: '2', command: 'phone', text: '555-1234', updated_at: Date.now() },
  // ... more macros
];

// 2. Create the manager
const manager = createNewSuggestionsOverlayManager(macros);

// 3. Create the coordinator with optional config
const coordinator = createNewSuggestionsCoordinator(manager, {
  triggerChar: '/',           // Character that triggers suggestions
  minBufferLength: 1,         // Minimum characters after trigger
  showAllShortcut: {          // Keyboard shortcut to show all macros
    key: ' ',                 // Space key
    ctrl: true,               // Requires Ctrl/Cmd
  },
});

// 4. Attach the coordinator to start listening
coordinator.attach();

// ✨ That's it! The coordinator now handles everything automatically:
// - Detects trigger character (/)
// - Shows/hides suggestions as user types
// - Handles keyboard shortcuts (Ctrl+Space, Escape)
// - Handles blur/focus events
// - Handles clicks outside


// ===== Advanced Usage =====

// Temporarily disable (e.g., in a specific input field)
coordinator.disable();

// Re-enable
coordinator.enable();

// Update configuration on the fly
coordinator.updateConfig({
  triggerChar: '@',
  minBufferLength: 2,
});

// Update macros in the manager
manager.updateMacros(newMacros);

// Clean up when done
coordinator.detach();
manager.destroy();


// ===== Example: Integration in your app initialization =====

class MacroApp {
  private manager: NewSuggestionsOverlayManager;
  private coordinator: NewSuggestionsCoordinator;

  initialize(macros: Macro[]) {
    // Create manager
    this.manager = createNewSuggestionsOverlayManager(macros);

    // Create coordinator
    this.coordinator = createNewSuggestionsCoordinator(this.manager, {
      triggerChar: '/',
      minBufferLength: 1,
      showAllShortcut: { key: ' ', ctrl: true },
    });

    // Start listening
    this.coordinator.attach();

    console.log('✅ Macro suggestions system initialized');
  }

  updateMacros(newMacros: Macro[]) {
    this.manager.updateMacros(newMacros);
  }

  destroy() {
    this.coordinator.detach();
    this.manager.destroy();
  }
}

// Usage
const app = new MacroApp();
app.initialize(macros);


// ===== Example: Manual triggering (without coordinator) =====

// If you need manual control (e.g., custom button)
const manualManager = createNewSuggestionsOverlayManager(macros);

// Trigger from a button click
document.querySelector('#show-macros-btn')?.addEventListener('click', () => {
  manualManager.showAll(); // Position calculated automatically
});

// Or show with specific position
document.querySelector('#custom-trigger')?.addEventListener('click', (e) => {
  const rect = e.target.getBoundingClientRect();
  manualManager.showAll(rect.left, rect.bottom);
});


// ===== Example: System macro integration =====

// If you have system macros that need to trigger the overlay
const systemMacros = {
  toggleSuggestions: () => {
    if (manager.isVisible()) {
      manager.hide();
    } else {
      manager.showAll();
    }
  },
};

// Register system macro
registerSystemMacro('toggle-suggestions', systemMacros.toggleSuggestions);