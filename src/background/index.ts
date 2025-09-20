import { syncMacros } from '../lib/sync'

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('sync-macros', { periodInMinutes: 15 })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-macros') syncMacros()
})

// initial sync
syncMacros()

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === 'online') {
    syncMacros().then(() => sendResponse({ ok: true }))
    return true
  }
})
