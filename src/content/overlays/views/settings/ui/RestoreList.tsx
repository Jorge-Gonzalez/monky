// Recovery, as the user meets it: a list of moments, and one line saying the durable copy is well.
//
// Read at the moment something has gone wrong, so every row answers "when" and "why" and none of
// them mentions where the data lives. Two sections with a Restore button each -- which is what this
// replaces -- made a person in trouble first work out that there were two independent recovery
// systems before they could use either.
import { useState } from 'react'
import type { Lang } from '../../../../../types'
import { t } from '../../../../../lib/i18n'
import type { BackupHealth } from '../../../../../store/backupHealth'
import type { SyncUsage } from '../../../../../store/syncBackup'
import { useRestorePoints } from '../useRestorePoints'
import { SettingsButton } from './SettingsLayout'

function describeWhen(iso: string, language: Lang): string {
  const when = new Date(iso)
  const time = when.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })
  const today = new Date()
  const sameDay =
    when.getFullYear() === today.getFullYear() &&
    when.getMonth() === today.getMonth() &&
    when.getDate() === today.getDate()
  if (sameDay) return t('settings.recover.today', { time })
  const date = when.toLocaleDateString(language, { day: 'numeric', month: 'short' })
  return t('settings.recover.earlier', { date, time })
}

const REASON_KEY = {
  delete: 'settings.recover.reason.delete',
  import: 'settings.recover.reason.import',
  restore: 'settings.recover.reason.restore',
  automatic: 'settings.recover.reason.automatic',
} as const

/**
 * The durable copy's state, as a sentence rather than a control.
 *
 * It used to be a "back up now" button, which contradicted the rule beside it -- writes that stay
 * inside the extension are automatic -- and made a failure something you had to think to go looking
 * for. Saying it plainly is strictly better than offering a button that reveals it.
 */
function healthLine(health: BackupHealth | null, usage: SyncUsage | null): { text: string; bad: boolean } {
  if (health?.status === 'too-large') {
    return { text: t('settings.recover.health.tooLarge', { kb: String(Math.round(health.bytes / 1024)) }), bad: true }
  }
  if (health?.status === 'failed') {
    return { text: t('settings.recover.health.failed', { error: health.detail }), bad: true }
  }
  const room =
    usage === null
      ? ''
      : ` ${t('settings.recover.health.room', {
          used: String(Math.round(usage.used / 1024)),
          total: String(Math.round(usage.total / 1024)),
        })}`
  return { text: `${t('settings.recover.health.ok')}${room}`, bad: false }
}

export function RestoreList({ language }: { language: Lang }) {
  const { points, health, usage, status, restore } = useRestorePoints()
  const [armedId, setArmedId] = useState<string | null>(null)
  const line = healthLine(health, usage)

  return (
    <div
      data-component="restore-list"
      className="vertical gap-xs"
    >
      {points.length === 0 ? (
        <p className="ink-soft font-sm">{t('settings.recover.empty')}</p>
      ) : (
        points.map((point) => (
          <div
            key={point.id}
            data-component="restore-row"
            className="horizontal gap-sm padding-block-xs align-center justify-between"
          >
            <span className="vertical">
              <span className="ink font-sm">{t(REASON_KEY[point.reason])}</span>
              <span className="ink-soft font-xs tabular">
                {describeWhen(point.at, language)} ·{' '}
                {t('settings.recover.count', { count: String(point.count) })}
                {/* Provenance is meaning, not mechanism: restoring a state another machine produced
                    is materially different from restoring your own. Where it is *stored* is not. */}
                {point.fromAnotherDevice && ` · ${t('settings.recover.fromAnotherDevice')}`}
              </span>
            </span>

            {armedId === point.id ? (
              <span className="horizontal inline gap-sm">
                <SettingsButton onClick={() => setArmedId(null)}>
                  {t('settings.recover.cancel')}
                </SettingsButton>
                <SettingsButton
                  onClick={() => {
                    setArmedId(null)
                    void restore(point)
                  }}
                >
                  {t('settings.recover.confirm')}
                </SettingsButton>
              </span>
            ) : (
              // Restoring replaces the whole library, so it asks first. The set being replaced is
              // kept before it goes, which is what makes saying yes recoverable.
              <SettingsButton onClick={() => setArmedId(point.id)}>
                {t('settings.recover.restore')}
              </SettingsButton>
            )}
          </div>
        ))
      )}

      <p
        data-component="backup-health"
        className={`font-xs ${line.bad ? 'ink-fail' : 'ink-soft'}`}
      >
        {line.text}
      </p>

      {status && (
        <p
          data-component="restore-status"
          className={`font-sm ${status.ok ? 'ink-accent' : 'ink-fail'}`}
          role="status"
        >
          {status.message}
        </p>
      )}
    </div>
  )
}
