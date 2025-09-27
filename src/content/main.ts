import { useMacroStore } from "../store/useMacroStore"
import { initMacroDetector, cleanupMacroDetector, setDetectorMacros } from "./MacroDetector"
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
    }
  } else {
    if (!isDetectorActive) {
      initMacroDetector()
      isDetectorActive = true
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
  setDetectorMacros(initialMacros)

  // Set up listeners for any subsequent changes to macros or config.
  listenMacrosChange(setDetectorMacros)
  useMacroStore.subscribe(manageDetectorState)

  // Run the initial check to activate or deactivate the detector.
  manageDetectorState()
}

main()
