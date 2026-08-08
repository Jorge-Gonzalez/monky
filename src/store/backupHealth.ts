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
import { measureSerialized } from './checksum'
import { serializeLibrary, type LibraryPayload } from './libraryShape'

const KEY = 'backup-health'

export type BackupHealth =
  | { at: string; status: 'ok' }
  /** The library no longer fits the browser account's quota. A standing condition, not a blip. */
  | { at: string; status: 'too-large'; bytes: number }
  /** Anything else the platform rejected: no account, rate limit, total quota. */
  | { at: string; status: 'failed'; detail: string }

/** What the settings line says, in the order of how much it should worry anyone. */
export type BackupState = 'ok' | 'pending' | 'never' | 'failed' | 'too-large'

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

/**
 * Whether the browser-account copy is the library currently on this device.
 *
 * Compares the whole payload, macros and settings together, because that is what the copy holds.
 * Comparing macros alone would report "backed up" to somebody who had just changed their prefixes
 * -- true of their macros, and false of the thing the sentence is about.
 */
export function backupIsCurrent(library: LibraryPayload, backupChecksum: string | undefined): boolean {
  return backupChecksum !== undefined && measureSerialized(serializeLibrary(library)).checksum === backupChecksum
}

/**
 * What to tell the user about the browser-account copy right now.
 *
 * Derived from the *current library* against the *committed backup*, not from the last attempt
 * alone. The difference is a lie the earlier version could tell: a backup succeeds, the user edits
 * three macros, the one-minute alarm has not fired yet -- and a line reading only the last outcome
 * says "up to date" about a library that is not backed up. The helper to compare them existed and
 * was never called, which is how the bug survived being written about.
 *
 * `pending` is the state that was missing, and it is the common one: for a minute after every edit,
 * the honest answer is "protecting the latest changes", not "protected".
 */
export function describeBackupState(
  library: LibraryPayload,
  backupChecksum: string | undefined,
  health: BackupHealth | null
): BackupState {
  if (backupChecksum === undefined) {
    // Nothing committed. A failure explains why; otherwise it simply has not happened yet.
    if (health?.status === 'too-large') return 'too-large'
    if (health?.status === 'failed') return 'failed'
    return 'never'
  }
  // A committed copy that matches what is loaded is the whole promise kept, whatever happened
  // afterwards -- a later attempt that found nothing to do is not a fault.
  if (backupIsCurrent(library, backupChecksum)) return 'ok'
  if (health?.status === 'too-large') return 'too-large'
  if (health?.status === 'failed') return 'failed'
  return 'pending'
}
