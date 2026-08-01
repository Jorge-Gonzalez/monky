// Pattern: Store-Hook — the browser-account backup, as the settings view needs it. Keeps the
// quota arithmetic and the restore conversation out of SettingsView, which is about config.
import { useCallback, useEffect, useState } from 'react'
import { useMacroStore } from '../../../../store/useMacroStore'
import { backupStatus, readBackup, syncUsage, type BackupManifest, type SyncUsage } from '../../../../store/syncBackup'
import { readEditLog, type EditEvent } from '../../../../store/editLog'
import { takeSnapshot } from '../../../../store/macroSnapshots'
import { deviceId } from '../../../../lib/deviceId'
import { t } from '../../../../lib/i18n'

export type SyncStatus = { ok: boolean; message: string } | null

export interface SyncBackupState {
  manifest: BackupManifest | null
  usage: SyncUsage | null
  log: EditEvent[]
  /** Whether the newest logged change came from somewhere other than this install. */
  fromAnotherDevice: boolean
  status: SyncStatus
  restore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useSyncBackup(): SyncBackupState {
  const [manifest, setManifest] = useState<BackupManifest | null>(null)
  const [usage, setUsage] = useState<SyncUsage | null>(null)
  const [log, setLog] = useState<EditEvent[]>([])
  const [fromAnotherDevice, setFromAnotherDevice] = useState(false)
  const [status, setStatus] = useState<SyncStatus>(null)

  const refresh = useCallback(async () => {
    const [nextManifest, nextUsage, nextLog, thisDevice] = await Promise.all([
      backupStatus(),
      syncUsage(),
      readEditLog(),
      deviceId(),
    ])
    setManifest(nextManifest)
    setUsage(nextUsage)
    setLog(nextLog)
    // Only the newest entry matters. "Somebody edited this on another machine at some point" is
    // true of almost any shared library and would make the warning permanent furniture.
    const newest = nextLog[nextLog.length - 1]
    setFromAnotherDevice(newest !== undefined && newest.dev !== thisDevice)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const flash = (ok: boolean, message: string) => {
    setStatus({ ok, message })
    setTimeout(() => setStatus(null), 5000)
  }

  const restore = useCallback(async () => {
    const result = await readBackup()
    if (result.status !== 'read') {
      // Three different situations, and collapsing them would be a disservice. "Half of it has
      // arrived" is worth waiting out; "nothing is there" and "what is there does not add up" are
      // not, and only one of the three suggests trying again later.
      const message = {
        none: 'settings.cloudBackup.status.none',
        incomplete: 'settings.cloudBackup.status.incomplete',
        corrupt: 'settings.cloudBackup.status.corrupt',
      } as const
      flash(false, t(message[result.status]))
      await refresh()
      return
    }

    // Forced, for the same reason the snapshot restore forces one: whatever is in the library right
    // now is about to be replaced, and whether it happens to match the last snapshot is beside the
    // point.
    await takeSnapshot(useMacroStore.getState().macros, { force: true })
    useMacroStore.getState().setMacros(result.macros)
    await refresh()
    flash(true, t('settings.cloudBackup.status.restored', { count: String(result.macros.length) }))
  }, [refresh])

  return { manifest, usage, log, fromAnotherDevice, status, restore, refresh }
}
