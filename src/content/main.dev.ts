// Development-only entry point for content script testing
// This version doesn't include CRXJS HMR client to avoid extension context errors

/**
 * Polyfill for `chrome.storage.local` in non-extension environments.
 * This allows the store and other modules to be tested on a standard webpage
 * without modification. It mimics the promise-based API of `chrome.storage`.
 */
if (typeof chrome === 'undefined' || !chrome.storage) {
  (window as any).chrome = {
    ...(window as any).chrome,
    storage: {
      local: {
        get: (key: string) => Promise.resolve({ [key]: localStorage.getItem(key) }),
        set: (items: { [key: string]: any }) => {
          Object.keys(items).forEach(key => localStorage.setItem(key, items[key]))
          return Promise.resolve()
        },
        remove: (key: string) => {
          localStorage.removeItem(key)
          return Promise.resolve()
        },
      },
      onChanged: { addListener: () => {}, removeListener: () => {} },
    },
  }
}

import { useMacroStore } from '../store/useMacroStore'
import { createMacroDetector, MacroDetector } from './detector/macroDetector'
import { createNewSuggestionsCoordinator } from './coordinators/NewSuggestionsCoordinator'
import { createNewSuggestionsOverlayManager } from './overlays/newSuggestionsOverlay/NewSuggestionsOverlayManager'
import { loadMacros, listenMacrosChange } from './storage/macroStorage'
import { Macro } from '../types'

// Module-level state for development
let detector: MacroDetector | null = null
let isDetectorActive = false

/**
 * Creates and initializes the macro detector for development.
 */
function createAndInitializeDetector(): MacroDetector {
  const overlayManager = createNewSuggestionsOverlayManager([])
  const suggestionsCoordinator = createNewSuggestionsCoordinator(overlayManager)
  const newDetector = createMacroDetector(suggestionsCoordinator)
  newDetector.initialize()
  return newDetector
}

/**
 * Checks the current configuration and hostname to decide whether to
 * activate or deactivate the macro detector.
 */
function manageDetectorState() {
  const { config } = useMacroStore.getState()
  const isDisabled = config.disabledSites.includes(window.location.hostname)

  if (isDisabled) {
    if (isDetectorActive) {
      detector?.destroy()
      detector = null
      isDetectorActive = false
      console.log('[DEV] Macro detector deactivated for', window.location.hostname)
    }
  } else {
    if (!isDetectorActive) {
      detector = createAndInitializeDetector()
      isDetectorActive = true

      // Set macros if we have them from the store already
      const macros = useMacroStore.getState().macros
      if (macros.length > 0) {
        detector.setMacros(macros)
        console.log('[DEV] Set', macros.length, 'initial macros on new detector')
      }

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
    console.log('[DEV] Loaded', initialMacros.length, 'initial macros from storage')

    const updateDetectorMacros = (macros: Macro[]) => {
      detector?.setMacros(macros)
    }

    // Set up listeners for any subsequent changes to macros or config.
    listenMacrosChange(updateDetectorMacros)
    useMacroStore.subscribe(manageDetectorState)

    // Run the initial check to activate or deactivate the detector.
    manageDetectorState()

    // If the detector was activated, ensure it has the initial macros.
    if (detector && initialMacros.length > 0) {
      // This might be redundant if the store was empty and got populated,
      // but it's a good safeguard.
      detector.setMacros(initialMacros)
    }

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