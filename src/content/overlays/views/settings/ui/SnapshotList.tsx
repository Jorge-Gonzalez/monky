// The automatic backups, as the user meets them. This list is read at the moment something has
// gone wrong, so it says "Earlier today, 14:32" rather than a revision number, and asks no
// understanding of checksums, retention tiers or where any of it is stored.
import { useState } from 'react'
import type { Lang } from '../../../../../types'
import { t } from '../../../../../lib/i18n'
import { snapshotBucket, type SnapshotMeta } from '../../../../../store/macroSnapshots'
import { useMacroSnapshots } from '../useMacroSnapshots'
import { SettingsButton } from './SettingsLayout'

function describeWhen(meta: SnapshotMeta, language: Lang, now: number): string {
  const when = new Date(meta.takenAt)
  const time = when.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })
  const bucket = snapshotBucket(meta.takenAt, now)
  if (bucket === 'today') return t('settings.snapshots.today', { time })
  if (bucket === 'yesterday') return t('settings.snapshots.yesterday', { time })
  const date = when.toLocaleDateString(language, { day: 'numeric', month: 'short' })
  return t('settings.snapshots.earlier', { date, time })
}

export function SnapshotList({ language }: { language: Lang }) {
  const { snapshots, status, restore } = useMacroSnapshots()
  const [armedRev, setArmedRev] = useState<number | null>(null)
  const now = Date.now()

  if (snapshots.length === 0) {
    return (
      <p
        data-component="snapshot-empty"
        className="ink-soft font-sm"
      >
        {t('settings.snapshots.empty')}
      </p>
    )
  }

  return (
    <div
      data-component="snapshot-list"
      className="vertical gap-xs scroll-auto max-height-results-sm
        scrollbar-subtle"
    >
      {snapshots.map((meta) => (
        <div
          key={meta.rev}
          data-component="snapshot-row"
          className="horizontal gap-sm padding-block-xs align-center justify-between"
        >
          <span className="vertical">
            <span className="ink font-sm">{describeWhen(meta, language, now)}</span>
            <span className="ink-soft font-xs tabular">
              {t('settings.snapshots.count', { count: String(meta.count) })}
            </span>
          </span>

          {armedRev === meta.rev ? (
            <span className="horizontal inline gap-sm">
              <SettingsButton onClick={() => setArmedRev(null)}>
                {t('settings.snapshots.cancel')}
              </SettingsButton>
              <SettingsButton
                onClick={() => {
                  setArmedRev(null)
                  void restore(meta.rev)
                }}
              >
                {t('settings.snapshots.confirm')}
              </SettingsButton>
            </span>
          ) : (
            // Restoring replaces the whole library, so it asks first. The current set is
            // snapshotted before it goes, which is what makes saying yes recoverable.
            <SettingsButton onClick={() => setArmedRev(meta.rev)}>
              {t('settings.snapshots.restore')}
            </SettingsButton>
          )}
        </div>
      ))}

      {status && (
        <p
          data-component="snapshot-status"
          className={`font-sm ${status.ok ? 'ink-accent' : 'ink-fail'}`}
          role="status"
        >
          {status.message}
        </p>
      )}
    </div>
  )
}
