import { startSyncBackup } from '../store/syncBackupWatcher'

// The browser-account copy. Registered here because the service worker is the one context that sees
// macro changes from every surface -- editor page, popup, content script -- so none of them has to
// know a backup exists. Registration is a storage listener, which is what wakes the worker, so it
// survives suspension.
//
// There is no local counterpart on this signal any more. The library as it stood before a
// destructive act is kept by the operation itself, in macroPrevious, because a copy taken on a timer
// captured the wrong moment and produced a pile of near-identical states nobody could choose between.
startSyncBackup()

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Open the full-page editor (content scripts can't call chrome.tabs directly).
  if (msg === 'open-editor') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') })
    sendResponse({ ok: true })
    return true
  }

  // Developer utility: reload content scripts
  if (msg === 'reload-content-scripts') {
    void chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          void chrome.tabs.reload(tab.id)
        }
      })
      sendResponse({ reloaded: tabs.length })
    })
    return true
  }
})
