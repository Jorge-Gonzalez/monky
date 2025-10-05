// Development-only entry point for content script testing
// This version doesn't include CRXJS HMR client to avoid extension context errors

import { useMacroStore } from "../store/useMacroStore"
import { initMacroDetector, cleanupMacroDetector, setDetectorMacros } from "./macroDetector"
import { loadMacros, listenMacrosChange } from "./macroStorage"

let isDetectorActive = false

/**
 * Checks the current configuration and hostname to decide whether to
 * activate or deactivate the macro detector.
 */
function manageDetectorState() {
  const { config } = useMacroStore.getState()
  const isDisabled = config.disabledSites.includes(window.location.hostname)

  if (isDisabled) {
    if (isDetectorActive) {
      cleanupMacroDetector()
      isDetectorActive = false
      console.log('[DEV] Macro detector deactivated for', window.location.hostname)
    }
  } else {
    if (!isDetectorActive) {
      initMacroDetector()
      isDetectorActive = true
      console.log('[DEV] Macro detector activated for', window.location.hostname)
    }
  }
}

/**
 * Main entry point for the content script (development version).
 */
async function main() {
  console.log('[DEV] Loading macro detection system...')
  
  try {
    // Wait for the store to be hydrated from storage before doing anything.
    await useMacroStore.persist.rehydrate()

    // Load initial macros and pass them to the detector.
    const initialMacros = await loadMacros()
    setDetectorMacros(initialMacros)
    console.log('[DEV] Loaded', initialMacros.length, 'macros')

    // Set up listeners for any subsequent changes to macros or config.
    listenMacrosChange(setDetectorMacros)
    useMacroStore.subscribe(manageDetectorState)

    // Run the initial check to activate or deactivate the detector.
    manageDetectorState()
    
    console.log('[DEV] ✅ Macro detection system ready!')
  } catch (error) {
    console.error('[DEV] ❌ Failed to initialize macro detection:', error)
  }
}

// Auto-execute for development
if (typeof window !== 'undefined') {
  main()
}

// Export for compatibility
export function onExecute() {
  main()
}