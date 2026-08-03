// Whether the browser-account backup is working, recorded where the interface can read it.
//
// This replaces a "back up now" button. That button existed for one good reason: everything
// automatic runs in the service worker, where a rejected write reaches a console nobody has open,
// and a backup that had never once succeeded still reported "not backed up yet" without explaining
// itself. Pressing it was the only way to see the error.
//
// But a failure you have to think to press a button to discover is a worse design than one that
// simply tells you. So the outcome of every attempt is written here, and the settings line reads it
// -- turning into the error when there is one. The button also contradicted the rule it sat beside:
// writes that stay inside the extension are automatic, and an explicit one implied otherwise.
//
// Local, not synced. "Did the copy from *this* machine succeed" is the question, and another
// device's answer would be misleading.
import type { Macro } from '../types'
import { measureMacros } from './checksum'

const KEY = 'backup-health'

export type BackupHealth =
  | { at: string; status: 'ok' }
  /** The library no longer fits the browser account's quota. A standing condition, not a blip. */
  | { at: string; status: 'too-large'; bytes: number }
  /** Anything else the platform rejected: no account, rate limit, total quota. */
  | { at: string; status: 'failed'; detail: string }

export async function readBackupHealth(): Promise<BackupHealth | null> {
  const stored = await chrome.storage.local.get(KEY)
  const value = stored[KEY] as BackupHealth | undefined
  return value && typeof value.at === 'string' ? value : null
}

export async function recordBackupHealth(health: BackupHealth): Promise<void> {
  await chrome.storage.local.set({ [KEY]: health })
}

/**
 * The message a thrown value actually carries.
 *
 * `String(error)` reads "[object Object]" for anything that is not an Error, which is precisely the
 * uninformative text this whole path exists to avoid showing someone.
 */
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return JSON.stringify(error)
}

/** Whether the browser-account copy is the library currently on this device. */
export function backupIsCurrent(macros: Macro[], backupChecksum: string | undefined): boolean {
  return backupChecksum !== undefined && measureMacros(macros).checksum === backupChecksum
}
