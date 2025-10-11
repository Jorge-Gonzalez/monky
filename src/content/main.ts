import { useMacroStore } from "../store/useMacroStore"
import { createMacroDetector, MacroDetector } from "./detector/macroDetector"
import { createSuggestionsCoordinator } from "./coordinators/suggestionsCoordinator"
import { loadMacros, listenMacrosChange } from "./storage/macroStorage"
import { updateAllMacros } from "./overlays"
import { Macro } from "../types"

// Module-level state
let detector: MacroDetector | null = null
let isDetectorActive = false

/**
 * Creates and initializes the macro detector with its action handlers.
 */
function createAndInitializeDetector(): MacroDetector {
  const suggestionsCoordinator = createSuggestionsCoordinator()
  const newDetector = createMacroDetector(suggestionsCoordinator)
  newDetector.initialize()
  return newDetector
}

/**
 * Updates the macros in the detector and overlay managers.
 */
function updateDetectorMacros(macros: Macro[]): void {
  if (detector) {
    detector.setMacros(macros)
  }
  
  // Also update overlay managers
  updateAllMacros(macros)
}

/**
 * Checks the current configuration and hostname to decide whether to
 * activate or deactivate the macro detector.
 */
function manageDetectorState() {
  const { config } = useMacroStore.getState()
  const isDisabled = config.disabledSites.includes(window.location.hostname)

  if (isDisabled) {
    if (isDetectorActive && detector) {
      detector.destroy()
      detector = null
      isDetectorActive = false
    }
  } else {
    if (!isDetectorActive) {
      detector = createAndInitializeDetector()
      isDetectorActive = true
      
      // Set macros if we have them
      const macros = useMacroStore.getState().macros
      if (macros.length > 0) {
        detector.setMacros(macros)
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

  // Load initial macros and pass them to the detector.
  const initialMacros = await loadMacros()
  
  // Set up listeners for any subsequent changes to macros or config.
  listenMacrosChange(updateDetectorMacros)
  useMacroStore.subscribe(manageDetectorState)

  // Initialize macros in the store if needed
  if (initialMacros.length > 0) {
    const currentMacros = useMacroStore.getState().macros
    if (currentMacros.length === 0) {
      useMacroStore.setState({ macros: initialMacros })
    }
  }

  // Run the initial check to activate or deactivate the detector.
  manageDetectorState()

  // If detector is active, set initial macros
  if (detector && initialMacros.length > 0) {
    detector.setMacros(initialMacros)
  }

  // Update overlay managers with the loaded macros
  const finalMacros = useMacroStore.getState().macros
  updateAllMacros(finalMacros)

  // Set a flag to indicate the content script is loaded (for debugging)
  ;(window as any).macroExtensionLoaded = true
}

/**
 * Cleanup function to destroy all resources.
 */
function cleanup() {
  if (detector) {
    detector.destroy()
    detector = null
    isDetectorActive = false
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

// Export detector access for debugging/testing
export function getDetector(): MacroDetector | null {
  return detector
}

// Auto-initialize when module is imported
main()

// Cleanup on unload (for hot reload during development)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanup()
  })
}