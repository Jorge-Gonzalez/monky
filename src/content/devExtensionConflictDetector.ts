/**
 * Extension Conflict Detector for Development Environment
 *
 * This module detects when both the extension's content script and the dev script
 * are running simultaneously on the same page, which causes double initialization.
 *
 * Communication uses DOM attributes because content scripts run in an isolated
 * JavaScript context and cannot share window properties with page scripts.
 */

export function initExtensionConflictDetector() {
  // Set a marker that the dev page is using the injected script
  document.documentElement.setAttribute('data-macro-dev-script-loaded', 'true');

  // Check for conflicts multiple times to catch the extension whenever it loads
  setTimeout(checkForExtensionConflict, 100);
  setTimeout(checkForExtensionConflict, 500);
  setTimeout(checkForExtensionConflict, 1000);
}

let warningShown = false;

function checkForExtensionConflict() {
  // Only show warning once
  if (warningShown) {
    return;
  }

  // Check if the extension's content script has also loaded
  // The extension sets a DOM attribute because content scripts run in isolated context
  const isConflict = document.documentElement.hasAttribute('data-macro-extension-loaded');

  if (isConflict) {
    // Show warning banner if it exists
    const warningBanner = document.getElementById('extension-warning');
    if (warningBanner) {
      warningBanner.classList.add('show');
    }

    console.error(
      '%c⚠️ EXTENSION CONFLICT DETECTED',
      'background: #ff6b6b; color: white; font-weight: bold; padding: 4px 8px; border-radius: 3px;',
      '\n\nThe Macro Replacer extension is active alongside the injected dev script.',
      '\nThis causes double initialization and unpredictable behavior.',
      '\n\nSolution: Disable the extension or add localhost to disabled sites.'
    );

    warningShown = true;
  }
}
