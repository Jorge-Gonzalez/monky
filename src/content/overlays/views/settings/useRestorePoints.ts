// Pattern: Store-Hook — recovery, as the settings view needs it.
//
// One list, whatever it was gathered from. The view never learns which storage a point came from,
// which is the whole point: a person who has just lost something should be choosing a *moment*, not
// a mechanism.
import { useCallback, useEffect, useState } from 'react'
import { useMacroStore } from '../../../../store/useMacroStore'
import { listRestorePoints, type RestorePoint } from '../../../../store/restorePoints'
import { keepPrevious } from '../../../../store/macroPrevious'
import { readBackupHealth, type BackupHealth } from '../../../../store/backupHealth'
import { syncUsage, type SyncUsage } from '../../../../store/syncBackup'
import { t } from '../../../../lib/i18n'

export type RestoreStatus = { ok: boolean; message: string } | null

export interface RestorePointsState {
  points: RestorePoint[]
  health: BackupHealth | null
  usage: SyncUsage | null
  status: RestoreStatus
  restore: (point: RestorePoint) => Promise<void>
  refresh: () => Promise<void>
}

export function useRestorePoints(): RestorePointsState {
  const [points, setPoints] = useState<RestorePoint[]>([])
  const [health, setHealth] = useState<BackupHealth | null>(null)
  const [usage, setUsage] = useState<SyncUsage | null>(null)
  const [status, setStatus] = useState<RestoreStatus>(null)

  const refresh = useCallback(async () => {
    const [nextPoints, nextHealth, nextUsage] = await Promise.all([
      listRestorePoints(),
      readBackupHealth(),
      syncUsage(),
    ])
    setPoints(nextPoints)
    setHealth(nextHealth)
    setUsage(nextUsage)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const flash = (ok: boolean, message: string) => {
    setStatus({ ok, message })
    setTimeout(() => setStatus(null), 5000)
  }

  const restore = useCallback(
    async (point: RestorePoint) => {
      const result = await point.read()
      if (result.status !== 'read') {
        // Three situations, kept distinct because only one of them is worth trying again: a copy
        // that has half-arrived will finish propagating, whereas an absent or mismatched one will
        // not. Collapsing them into "restore failed" would hide that.
        const message = {
          none: 'settings.recover.status.none',
          incomplete: 'settings.recover.status.incomplete',
          corrupt: 'settings.recover.status.corrupt',
        } as const
        flash(false, t(message[result.status]))
        await refresh()
        return
      }

      // The restore is itself destructive, so it leaves its own way back. Without this, recovering
      // to the wrong moment would be the one act in the app with no undo.
      await keepPrevious(useMacroStore.getState().macros, 'restore')
      useMacroStore.getState().setMacros(result.macros)
      await refresh()
      flash(true, t('settings.recover.status.restored', { count: String(result.macros.length) }))
    },
    [refresh]
  )

  return { points, health, usage, status, restore, refresh }
}
