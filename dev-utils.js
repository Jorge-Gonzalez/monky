// Developer utilities for macro extension development
// Copy-paste these functions into browser console for quick testing

// Reload all tabs with content scripts
function reloadContentScripts() {
  chrome.runtime.sendMessage('reload-content-scripts', (response) => {
    console.log(`Reloaded ${response.reloaded} tabs`);
  });
}

// Reload just current tab
function reloadCurrentTab() {
  chrome.tabs.getCurrent((tab) => {
    if (tab.id) {
      chrome.tabs.reload(tab.id);
      console.log('Current tab reloaded');
    }
  });
}

// Quick test macro trigger (paste in page console)
function testMacro(command = '/sig') {
  const input = document.querySelector('input, textarea, [contenteditable]');
  if (input) {
    input.focus();
    input.value = command + ' ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    console.log(`Triggered macro: ${command}`);
  } else {
    console.log('No input field found on page');
  }
}

// Usage examples:
console.log(`
Developer Utils Loaded!

Usage:
- reloadContentScripts() // Reload all tabs
- reloadCurrentTab()     // Reload current tab  
- testMacro('/sig')      // Test macro expansion

Or use keyboard shortcut Ctrl+R for current tab
`);