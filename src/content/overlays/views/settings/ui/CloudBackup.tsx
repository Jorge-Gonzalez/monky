// The browser-account backup, as the user meets it.
//
// Three facts, in the order someone reaching for this cares about them: whether there is a copy and
// how old it is, whether it came from somewhere else, and how much room is left. The quota meter is
// last because it only matters before it is nearly full -- and it is the readout that decides
// whether compressing the backup is ever worth building, so it is a diagnostic as much as a
// reassurance.
import { useState } from 'react'
import type { Lang } from '../../../../../types'
import { t } from '../../../../../lib/i18n'
import { useSyncBackup } from '../useSyncBackup'
import { SettingsButton } from './SettingsLayout'

function describeWhen(iso: string, language: Lang): string {
  const when = new Date(iso)
  const time = when.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })
  const date = when.toLocaleDateString(language, { day: 'numeric', month: 'short' })
  return `${date}, ${time}`
}

export function CloudBackup({ language }: { language: Lang }) {
  const { manifest, usage, fromAnotherDevice, status, restore } = useSyncBackup()
  const [armed, setArmed] = useState(false)

  const nearlyFull = usage !== null && usage.fraction > 0.8

  return (
    <div
      data-component="cloud-backup"
      className="vertical gap-xs"
    >
      {manifest === null ? (
        <p className="ink-soft font-sm">{t('settings.cloudBackup.empty')}</p>
      ) : (
        <div className="horizontal gap-sm padding-block-xs align-center justify-between">
          <span className="vertical">
            <span className="ink font-sm">
              {t('settings.cloudBackup.lastBackup', { when: describeWhen(manifest.takenAt, language) })}
            </span>
            <span className="ink-soft font-xs tabular">
              {t('settings.cloudBackup.count', { count: String(manifest.count) })}
            </span>
            {/* Only when it is true, and only about the most recent change: the point is to warn
                before an overwrite, not to narrate the library's history. */}
            {fromAnotherDevice && (
              <span
                data-component="cloud-backup-elsewhere"
                className="ink-soft font-xs"
              >
                {t('settings.cloudBackup.fromAnotherDevice')}
              </span>
            )}
          </span>

          {armed ? (
            <span className="horizontal inline gap-sm">
              <SettingsButton onClick={() => setArmed(false)}>
                {t('settings.cloudBackup.cancel')}
              </SettingsButton>
              <SettingsButton
                onClick={() => {
                  setArmed(false)
                  void restore()
                }}
              >
                {t('settings.cloudBackup.confirm')}
              </SettingsButton>
            </span>
          ) : (
            // Restore is the one direction that stays explicit. The backup half happens on its own;
            // replacing a library is something a user should be present for.
            <SettingsButton onClick={() => setArmed(true)}>
              {t('settings.cloudBackup.restore')}
            </SettingsButton>
          )}
        </div>
      )}

      {usage !== null && (
        <div
          data-component="cloud-backup-quota"
          className="vertical gap-2xs"
        >
          <div
            className="ruled rule corner-sm ground-subtle"
            style={{ height: '4px', overflow: 'hidden' }}
            role="progressbar"
            aria-valuenow={Math.round(usage.fraction * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('settings.cloudBackup.quotaLabel')}
          >
            <div
              className={nearlyFull ? 'ground-fail' : 'ground-accent'}
              style={{ height: '100%', width: `${String(Math.round(usage.fraction * 100))}%` }}
            />
          </div>
          <span className={`font-xs tabular ${nearlyFull ? 'ink-fail' : 'ink-soft'}`}>
            {t('settings.cloudBackup.quota', {
              used: String(Math.round(usage.used / 1024)),
              total: String(Math.round(usage.total / 1024)),
            })}
          </span>
        </div>
      )}

      {status && (
        <p
          data-component="cloud-backup-status"
          className={`font-sm ${status.ok ? 'ink-accent' : 'ink-fail'}`}
          role="status"
        >
          {status.message}
        </p>
      )}
    </div>
  )
}
