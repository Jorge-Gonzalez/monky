import { useMacroStore } from "../store/useMacroStore"
import { createMacroDetector,MacroDetector } from "./macroEngine/macroDetector"
import { loadMacros, listenMacrosChange } from "./storage/macroStorage"
import { updateAllMacros, suggestionsCoordinator, searchCoordinator } from "./overlays"
import { Macro } from "../types"

// Module-level state
let macroEngine: MacroDetector | null = null
let isDetectorActive = false
let isSuggestionsCoordinatorAttached = false

/**
 * Creates and initializes the macro engine with its action handlers.
 */
function createAndInitializeMacroEngine(): MacroDetector {
  const engine = createMacroDetector(suggestionsCoordinator)
  engine.initialize()
  return engine
}

/**
 * Updates the macros in the macro engine and coordinators.
 */
function updateMacros(macros: Macro[]): void {
  if (macroEngine) {
    macroEngine.setMacros(macros)
  }
  // Keep coordinators in sync with updated macros
  updateAllMacros(macros)
}

/**
 * Checks the current configuration and hostname to decide whether to
 * activate or deactivate the macro system and coordinator.
 */
function manageMacroState() {
  const { config } = useMacroStore.getState()
  const isDisabled = config.disabledSites.includes(window.location.hostname)

  if (isDisabled) {
    if (isDetectorActive && macroEngine) {
      macroEngine.destroy()
      macroEngine = null
      isDetectorActive = false
    }

    if (isSuggestionsCoordinatorAttached) {
      suggestionsCoordinator.detach()
      isSuggestionsCoordinatorAttached = false
    }

    // Detach the search coordinator when disabled
    searchCoordinator.detach()
  } else {
    // Attach the search coordinator when enabled
    searchCoordinator.attach()

    // Ensure the suggestions coordinator is attached
    if (!isSuggestionsCoordinatorAttached) {
      suggestionsCoordinator.attach()
      isSuggestionsCoordinatorAttached = true

      // Provide current macros to the coordinator immediately
      const macros = useMacroStore.getState().macros
      if (macros.length > 0) {
        suggestionsCoordinator.setMacros(macros)
      }
    }

    if (!isDetectorActive) {
      macroEngine = createAndInitializeMacroEngine()
      isDetectorActive = true

      // Set macros if we have them
      const macros = useMacroStore.getState().macros
      if (macros.length > 0) {
        macroEngine.setMacros(macros)
      }
    }

    // Wire the coordinators to use macro engine's functions for proper undo tracking
    // This should happen every time manageMacroState runs when enabled, not just on first activation
    if (macroEngine) {
      suggestionsCoordinator.setOnMacroSelected((macro, buffer, element) => {
        if (macroEngine) {
          macroEngine.handleMacroSelectedFromOverlay(macro, buffer, element)
        }
      })

      searchCoordinator.setOnMacroSelected((macro, element) => {
        if (macroEngine) {
          macroEngine.handleMacroSelectedFromSearchOverlay(macro, element)
        }
      })
    }
  }
}

/**
 * Main entry point for the content script.
 */
async function main() {
  // Wait for the store to be hydrated from storage before doing anything.
  await useMacroStore.persist.rehydrate()

  // Load initial macros
  const initialMacros = await loadMacros()

  // Set up listeners for any subsequent changes to macros or config.
  listenMacrosChange(updateMacros)
  useMacroStore.subscribe(manageMacroState)

  // Initialize macros in the store if needed
  if (initialMacros.length > 0) {
    const currentMacros = useMacroStore.getState().macros
    if (currentMacros.length === 0) {
      useMacroStore.setState({ macros: initialMacros })
    }
  }

  // Run the initial check to activate or deactivate the macro system and coordinator.
  manageMacroState()

  // If macro engine is active, set initial macros
  if (macroEngine && initialMacros.length > 0) {
    macroEngine.setMacros(initialMacros)
  }

  // Keep overlay managers updated as well
  const finalMacros = useMacroStore.getState().macros
  updateAllMacros(finalMacros)

  // Set a flag to indicate the content script is loaded (for debugging)
  ;(window as any).macroExtensionLoaded = true
}

/**
 * Cleanup function to destroy all resources.
 */
function cleanup() {
  if (macroEngine) {
    macroEngine.destroy()
    macroEngine = null
    isDetectorActive = false
  }

  if (isSuggestionsCoordinatorAttached) {
    suggestionsCoordinator.detach()
    isSuggestionsCoordinatorAttached = false
  }

  // Detach search coordinator
  searchCoordinator.detach()
}

// Export init function for tests compatibility
export async function init() {
  await main()
}

// Export cleanup for tests
export function cleanupMacroSystem() {
  cleanup()
}

// Export onExecute function for CRXJS plugin compatibility
export function onExecute() {
  main()
}

// Export macro engine access for debugging/testing
export function getMacroEngine(): MacroDetector | null {
  return macroEngine
}

// Auto-initialize when module is imported
main()

// Cleanup on unload (for hot reload during development)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanup()
  })
}