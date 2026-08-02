// Pattern: Store-Hook — the automatic backups, as the settings view needs them. Keeps the
// listing and the restore conversation out of SettingsView, which is about config.
import { useCallback, useEffect, useState } from 'react'
import { useMacroStore } from '../../../../store/useMacroStore'
import {
  listSnapshots,
  readSnapshot,
  takeSnapshot,
  type SnapshotMeta,
} from '../../../../store/macroSnapshots'
import { t } from '../../../../lib/i18n'

export type RestoreStatus = { ok: boolean; message: string } | null

export function useMacroSnapshots() {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([])
  const [status, setStatus] = useState<RestoreStatus>(null)

  const refresh = useCallback(async () => {
    setSnapshots(await listSnapshots())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const flash = (ok: boolean, message: string) => {
    setStatus({ ok, message })
    setTimeout(() => setStatus(null), 4000)
  }

  const restore = useCallback(
    async (rev: number) => {
      const macros = await readSnapshot(rev)
      // A missing payload means the index and the store disagree. Say so rather than replacing
      // the library with nothing, which is the one outcome worse than not restoring.
      if (macros === null) {
        flash(false, t('settings.snapshots.status.unreadable'))
        await refresh()
        return
      }

      // Forced, because this is the write that must never be coalesced away: whatever is in the
      // library right now is about to be replaced, and whether it happens to match the last
      // snapshot is beside the point.
      await takeSnapshot(useMacroStore.getState().macros, { force: true, reason: 'restore' })
      useMacroStore.getState().setMacros(macros)
      await refresh()
      flash(true, t('settings.snapshots.status.restored', { count: String(macros.length) }))
    },
    [refresh]
  )

  return { snapshots, status, restore, refresh }
}
