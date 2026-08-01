// Turns macro changes into a debounced backup to the browser account.
//
// The debounce is an alarm rather than a setTimeout, and that is not a style choice. An MV3 service
// worker is torn down when it goes idle, taking every pending timer with it: a one-minute
// setTimeout would simply not fire, and the backup would silently not happen. Alarms survive
// suspension and wake the worker, which is the only mechanism that can debounce across it. The
// local snapshot watcher can keep its 5 s setTimeout because the change event that schedules it has
// already reset the idle countdown and 5 s clears comfortably; a minute does not.
//
// Creating an alarm with a name that already exists replaces it, so rescheduling on every change is
// the debounce, with no bookkeeping of our own.
import { listenStoredMacrosDiff, loadStoredMacros } from '../content/storage/macroStorage'
import { deviceId } from '../lib/deviceId'
import { appendEditEvents, summarizeChange } from './editLog'
import { writeBackup } from './syncBackup'

const ALARM = 'sync-backup'
const DELAY_MINUTES = 1

/**
 * Run a backup from whatever is currently stored.
 *
 * Reads storage rather than trusting a value carried from the change event: by the time the alarm
 * fires the library may have moved on again, and the newest state is the one worth backing up.
 */
export async function runSyncBackup(): Promise<void> {
  const macros = await loadStoredMacros()
  if (macros === null) return
  const device = await deviceId()
  const result = await writeBackup(macros, device)
  if (result.status === 'too-large') {
    // Not a failure to retry. The library no longer fits the browser account's quota, which is a
    // standing condition the settings readout is there to show; logging it once per attempt would
    // bury the fact under repetition.
    console.warn(
      `[MONKY] the macro library needs ${String(result.needed)} sync chunks and the quota allows fewer; ` +
        'the browser-account backup is not being updated. Local backups are unaffected.'
    )
  }
}

/**
 * Watch for macro changes: record what changed straight away, and schedule the backup.
 *
 * The edit log is written immediately rather than at the alarm, because it is describing *this*
 * change and the diff is only available here -- `oldValue` comes off the change event, so nothing
 * has to be remembered across a suspension to produce it.
 */
export function startSyncBackup({ delayInMinutes = DELAY_MINUTES } = {}): void {
  listenStoredMacrosDiff((before, after) => {
    void (async () => {
      const summary = summarizeChange(before, after)
      if (summary.length > 0) {
        await appendEditEvents(summary, await deviceId())
      }
      await chrome.alarms.create(ALARM, { delayInMinutes })
    })().catch((error: unknown) => {
      console.warn('[MONKY] could not schedule a browser-account backup:', error)
    })
  })

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM) return
    runSyncBackup().catch((error: unknown) => {
      // No UI to surface this from, and a failed backup must never disturb the library it was
      // copying: local storage already holds the good copy.
      console.warn('[MONKY] browser-account backup failed:', error)
    })
  })
}
