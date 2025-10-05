// Auto-refresh utility for content script development
// Add this to your test page to automatically refresh when files change

(function() {
  let lastModified = Date.now();
  
  async function checkForChanges() {
    try {
      // Check if HMR server is running
      const response = await fetch('http://localhost:5173/', { 
        method: 'HEAD',
        cache: 'no-cache' 
      });
      
      if (response.ok) {
        const serverTime = new Date(response.headers.get('last-modified') || Date.now()).getTime();
        
        if (serverTime > lastModified) {
          console.log('[DEV] Content script changes detected, refreshing...');
          lastModified = serverTime;
          
          // Option 1: Reload just this tab
          location.reload();
          
          // Option 2: Send message to background to reload all tabs
          // chrome.runtime.sendMessage('reload-content-scripts');
        }
      }
    } catch (e) {
      // HMR server not running, that's okay
    }
  }
  
  // Check every 2 seconds
  setInterval(checkForChanges, 2000);
  
  console.log('[DEV] Auto-refresh enabled - will reload when content script changes');
})();