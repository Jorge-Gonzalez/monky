import { useMacroStore } from "../store/useMacroStore"
import { createMacroDetector,MacroDetector } from "./macroEngine/macroDetector"
import { createSuggestionsCoordinator, SuggestionsCoordinator } from "./coordinators/SuggestionsCoordinator"
import { loadMacros, listenMacrosChange } from "./storage/macroStorage"
import { updateAllMacros, suggestionsOverlayManager, searchOverlayManager } from "./overlays"
import { Macro } from "../types"

// Module-level state
let macroEngine: MacroDetector | null = null
let isDetectorActive = false
let suggestionsCoordinator: SuggestionsCoordinator | null = null
let overlayManager = suggestionsOverlayManager

/**
 * Creates and initializes the macro engine with its action handlers.
 */
function createAndInitializeMacroEngine(actions: SuggestionsCoordinator): MacroDetector {
  const engine = createMacroDetector(actions)
  engine.initialize()
  return engine
}

/**
 * Updates the macros in the macro engine, coordinator and overlay managers.
 */
function updateMacros(macros: Macro[]): void {
  if (macroEngine) {
    macroEngine.setMacros(macros)
  }
  // Keep overlay managers in sync (if they subscribe separately)
  updateAllMacros(macros)
  // Ensure the single coordinator instance has the latest macros
  if (suggestionsCoordinator) {
    suggestionsCoordinator.setMacros(macros)
  }
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

    if (suggestionsCoordinator) {
      suggestionsCoordinator.detach()
      suggestionsCoordinator = null
    }
  } else {
    // Ensure a single coordinator instance is created and attached
    if (!suggestionsCoordinator) {
      suggestionsCoordinator = createSuggestionsCoordinator(overlayManager)
      suggestionsCoordinator.attach()

      // Provide current macros to the coordinator immediately
      const macros = useMacroStore.getState().macros
      if (macros.length > 0) {
        suggestionsCoordinator.setMacros(macros)
      }
    }

    if (!isDetectorActive) {
      macroEngine = createAndInitializeMacroEngine(suggestionsCoordinator)
      isDetectorActive = true

      // Wire the suggestions overlay manager to use macro engine's replacement function for proper undo tracking
      overlayManager.setOnMacroSelected((macro, buffer, element) => {
        if (macroEngine) {
          macroEngine.handleMacroSelectedFromOverlay(macro, buffer, element)
        }
      })

      // Wire the search overlay manager to use macro engine's insertion function for proper undo tracking
      searchOverlayManager.setOnMacroSelected((macro, element) => {
        if (macroEngine) {
          macroEngine.handleMacroSelectedFromSearchOverlay(macro, element)
        }
      })

      // Set macros if we have them
      const macros = useMacroStore.getState().macros
      if (macros.length > 0) {
        macroEngine.setMacros(macros)
      }
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

  if (suggestionsCoordinator) {
    suggestionsCoordinator.detach()
    suggestionsCoordinator = null
  }
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