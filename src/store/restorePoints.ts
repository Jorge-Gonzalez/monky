// Everywhere the library can be recovered from, presented as one list.
//
// The interface this replaces had two independent recovery sections with a Restore button each,
// sourced from different storage, with nothing to tell a person in trouble which one they wanted.
// That is a worse position than having one, and arguably worse than having none.
//
// So the source stops being a category the user has to reason about. A restore point is a moment --
// when it was, and why it exists -- and the storage behind it is an implementation detail that never
// reaches the screen. What does reach the screen is *meaning*: a state that came from another device
// is materially different from your own and says so. "Slot B" is mechanism; "from another device" is
// not.
//
// This merges cleanly rather than papering over a conflict, because the two sources are almost never
// both meaningful at once. The browser-account copy holds the latest state, so on a working machine
// it is what you already have; it becomes the only thing that matters at the moment the local data
// is gone, which is exactly when the local entries do not exist either.
import type { Macro } from '../types'
import { readPrevious } from './macroPrevious'
import { validateLibrary } from './libraryShape'
import { backupStatus, readBackup, type BackupManifest } from './syncBackup'
import { readEditLog, type EditEvent } from './editLog'
import { deviceId } from '../lib/deviceId'

export type RestoreReason = 'delete' | 'import' | 'restore' | 'automatic'

/** What reading a restore point produced. Mirrors the backup's own outcomes, since one source has them. */
export type RestoreRead =
  | { status: 'read'; macros: Macro[] }
  | { status: 'none' }
  | { status: 'incomplete' }
  | { status: 'corrupt' }
  /** Written by a newer version of the extension than the one reading it. */
  | { status: 'too-new'; schema: number }

export interface RestorePoint {
  /** Stable across refreshes, for list keys and for arming a confirmation. */
  id: string
  at: string
  reason: RestoreReason
  count: number
  /** Set only when the state came from somewhere other than this install. */
  fromAnotherDevice: boolean
  checksum: string
  read: () => Promise<RestoreRead>
}

/**
 * Newest first.
 *
 * De-duplication is between entries, **never against the current library**. An earlier draft hid the
 * browser-account copy whenever it matched what was already loaded -- which is nearly always -- and
 * the result was a backup with no visible way to restore from it, and no way to check that it works.
 * A backup you cannot exercise is a promise rather than a fact. Restoring a copy identical to the
 * current one is a harmless no-op, and being able to do it is the only proof the thing functions.
 */
export async function listRestorePoints(): Promise<RestorePoint[]> {
  // The browser-account reads are allowed to fail without taking the local ones with them.
  //
  // `chrome.storage.sync` can be unavailable for reasons that have nothing to do with this device's
  // own recovery copies -- no browser account, sync disabled by policy, or a platform that does not
  // implement part of the API. Letting that reject the whole gather would mean a person who has
  // just deleted something is shown an empty list, with the perfectly readable local states sitting
  // right there. The design's own rule applies inside this function: the least-depended-on layer
  // failing must not remove the most-depended-on.
  const [previous, manifest, log, thisDevice] = await Promise.all([
    readPrevious(),
    backupStatus().catch((): BackupManifest | null => null),
    readEditLog().catch((): EditEvent[] => []),
    deviceId(),
  ])

  const points: RestorePoint[] = previous.map((entry, index) => ({
    id: `previous:${String(index)}:${entry.checksum}`,
    at: entry.at,
    reason: entry.reason,
    count: entry.count,
    // A local pre-destruction state was, by definition, produced on this machine.
    fromAnotherDevice: false,
    checksum: entry.checksum,
    // Validated on the way out rather than trusted. A local copy can be damaged by the same things
    // that damage the live library -- a bad write, a failed migration -- and restoring an unusable
    // one over a working library is the outcome this whole layer exists to prevent.
    read: () => {
      const check = validateLibrary(entry.macros, entry.schema ?? 1)
      if (check.status === 'too-new') return Promise.resolve({ status: 'too-new', schema: check.schema })
      if (check.status === 'malformed') return Promise.resolve({ status: 'corrupt' })
      return Promise.resolve({ status: 'read', macros: check.macros })
    },
  }))

  if (manifest !== null) {
    // Only the newest entry decides this. "Somebody edited this elsewhere at some point" is true of
    // almost any shared library and would leave the note up permanently.
    const newest = log[log.length - 1]
    points.push({
      id: `backup:${String(manifest.rev)}`,
      at: manifest.takenAt,
      reason: 'automatic',
      count: manifest.count,
      fromAnotherDevice:
        manifest.device !== thisDevice || (newest !== undefined && newest.dev !== thisDevice),
      checksum: manifest.checksum,
      read: readBackup,
    })
  }

  const seen = new Set<string>()
  return points
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .filter((point) => {
      if (seen.has(point.checksum)) return false
      seen.add(point.checksum)
      return true
    })
}
