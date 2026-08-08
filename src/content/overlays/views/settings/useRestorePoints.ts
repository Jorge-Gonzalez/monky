// Pattern: Store-Hook — recovery, as the settings view needs it.
//
// One list, whatever it was gathered from. The view never learns which storage a point came from,
// which is the whole point: a person who has just lost something should be choosing a *moment*, not
// a mechanism.
import { useCallback, useEffect, useState } from 'react'
import { useMacroStore } from '../../../../store/useMacroStore'
import { listRestorePoints, type RestorePoint } from '../../../../store/restorePoints'
import { keepPrevious } from '../../../../store/macroPrevious'
import { describeBackupState, readBackupHealth, type BackupState } from '../../../../store/backupHealth'
import { syncUsage, type SyncUsage } from '../../../../store/syncBackup'
import { t } from '../../../../lib/i18n'
import { kilobytes } from '../../../../lib/kilobytes'

export type RestoreStatus = { ok: boolean; message: string } | null

export interface RestorePointsState {
  points: RestorePoint[]
  /** Derived from the live library against the committed copy, not from the last attempt alone. */
  state: BackupState
  /** Only set when `state` is 'too-large' or 'failed', to say what went wrong. */
  detail: string | null
  usage: SyncUsage | null
  status: RestoreStatus
  restore: (point: RestorePoint) => Promise<void>
  refresh: () => Promise<void>
}

export function useRestorePoints(): RestorePointsState {
  const [points, setPoints] = useState<RestorePoint[]>([])
  const [state, setState] = useState<BackupState>('never')
  const [detail, setDetail] = useState<string | null>(null)
  const [usage, setUsage] = useState<SyncUsage | null>(null)
  const [status, setStatus] = useState<RestoreStatus>(null)

  const refresh = useCallback(async () => {
    const [nextPoints, nextHealth, nextUsage] = await Promise.all([
      listRestorePoints(),
      readBackupHealth(),
      // A readout, not a fact anyone acts on. Before this it could reject and take the whole
      // recovery panel with it -- the least important thing on screen emptying the most important.
      syncUsage().catch((): SyncUsage | null => null),
    ])
    setPoints(nextPoints)
    setUsage(nextUsage)
    // The committed copy's checksum comes off the restore point the backup contributed, so the
    // comparison is against what is actually stored rather than what was last attempted.
    const committed = nextPoints.find((point) => point.reason === 'automatic')?.checksum
    const { macros, config } = useMacroStore.getState()
    setState(describeBackupState({ macros, config }, committed, nextHealth))
    setDetail(
      nextHealth?.status === 'too-large'
        ? kilobytes(nextHealth.bytes)
        : nextHealth?.status === 'failed'
          ? nextHealth.detail
          : null
    )
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
          'too-new': 'settings.recover.status.tooNew',
        } as const
        flash(false, t(message[result.status]))
        await refresh()
        return
      }

      // The restore is itself destructive, so it leaves its own way back. Without this, recovering
      // to the wrong moment would be the one act in the app with no undo.
      const store = useMacroStore.getState()
      await keepPrevious({ macros: store.macros, config: store.config }, 'restore')
      store.setMacros(result.macros)
      // Settings only when the copy carried them. Every copy written before schema 2 holds macros
      // alone, and reading that absence as "no preferences" would reset this device's prefixes on
      // every restore from an older backup -- macros back, none of them triggering.
      if (result.config !== undefined) store.setConfig(result.config)
      await refresh()
      flash(true, t('settings.recover.status.restored', { count: String(result.macros.length) }))
    },
    [refresh]
  )

  return { points, state, detail, usage, status, restore, refresh }
}
