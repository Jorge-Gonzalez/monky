import { syncMacros } from '../lib/sync'

// A sync failure here has no UI to surface it, so every call logs rather than
// rejecting into nothing. The chrome.* registrations are genuinely fire-and-forget
// and are voided explicitly to say so.
function runSync(reason: string): void {
  syncMacros().catch((error: unknown) => {
    console.warn(`[MONKY] sync failed (${reason}):`, error)
  })
}

chrome.runtime.onInstalled.addListener(() => {
  void chrome.alarms.create('sync-macros', { periodInMinutes: 15 })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-macros') runSync('alarm')
})

// initial sync
runSync('startup')

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === 'online') {
    syncMacros()
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => {
        console.warn('[MONKY] sync failed (online):', error)
        sendResponse({ ok: false })
      })
    return true
  }

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
