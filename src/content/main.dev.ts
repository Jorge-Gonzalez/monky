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
import { createMacroDetector,MacroDetector } from "./macroEngine/macroDetector"
import { loadMacros, listenMacrosChange } from './storage/macroStorage'
import { suggestionsCoordinator, searchCoordinator } from './overlays'
import { Macro } from '../types'
import { initExtensionConflictDetector } from './devExtensionConflictDetector'

// Module-level state for development
let macroEngine: MacroDetector | null = null
let isDetectorActive = false
let isSuggestionsCoordinatorAttached = false

/**
 * Creates and initializes the macro core for development.
 */
function createAndInitializeMacroEngine(): MacroDetector {
  const engine = createMacroDetector(suggestionsCoordinator)
  engine.initialize()
  return engine
}

/**
 * Checks the current configuration and hostname to decide whether to
 * activate or deactivate the macro system.
 */
function manageMacroState() {
  const { config } = useMacroStore.getState()
  const isDisabled = config.disabledSites.includes(window.location.hostname)

  if (isDisabled) {
    if (isDetectorActive) {
      macroEngine?.destroy()
      macroEngine = null
      isDetectorActive = false
      console.log('[DEV] Macro system deactivated for', window.location.hostname)
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

      // Set macros if we have them from the store already
      const macros = useMacroStore.getState().macros
      if (macros.length > 0) {
        macroEngine.setMacros(macros)
        console.log('[DEV] Set', macros.length, 'initial macros on new macro core')
      }

      console.log('[DEV] Macro system activated for', window.location.hostname)
    }

    // Wire the coordinators to use macro engine's functions for proper undo tracking
    // This should happen every time manageMacroState runs when enabled
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

    const updateMacros = (macros: Macro[]) => {
      macroEngine?.setMacros(macros)
    }

    // Set up listeners for any subsequent changes to macros or config.
    listenMacrosChange(updateMacros)
    useMacroStore.subscribe(manageMacroState)

    // Run the initial check to activate or deactivate the macro system.
    manageMacroState()

    // If the macro core was activated, ensure it has the initial macros.
    if (macroEngine && initialMacros.length > 0) {
      // This might be redundant if the store was empty and got populated,
      // but it's a good safeguard.
      macroEngine.setMacros(initialMacros)
    }

    console.log('[DEV] ✅ Macro detection system ready!')
  } catch (error) {
    console.error('[DEV] ❌ Failed to initialize macro detection:', error)
  }
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

// Auto-execute for development
if (typeof window !== 'undefined') {
  main()
  initExtensionConflictDetector()
}

// Export for compatibility
export function onExecute() {
  main()
}

// Export cleanup for tests
export function cleanupMacroSystem() {
  cleanup()
}

// Cleanup on unload (for hot reload during development)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanup()
  })
}