import type { ReactNode } from 'react'

// The settings page is three sections of labelled rows, and every one of them was spelled
// out in full. These are the shapes that were repeated: a section (label beside a body),
// a row (label beside its control), the rule between sections, and the one button style
// the data section uses twice.

interface SettingsSectionProps {
  label: string
  children: ReactNode
}

export function SettingsSection({ label, children }: SettingsSectionProps) {
  return (
    <div className="columns-12 padding-block-xl padding-inline-3xl">
      <div
        data-component="settings-section-label"
        className="quarter padding-right-sm padding-top-md padding-bottom-none padding-left-none
          ink-accent-soft font-xs font-medium overline"
      >
        {label}
      </div>
      <div data-component="settings-section-body" className="elastic basis-ratio three-quarters min-width-none">
        {children}
      </div>
    </div>
  )
}

interface SettingsRowProps {
  label: string
  children: ReactNode
}

export function SettingsRow({ label, children }: SettingsRowProps) {
  return (
    <div data-component="settings-row" className="horizontal gap-lg padding-block-sm align-center justify-between">
      <span data-component="settings-row-label" className="rigid
        ink font-md">
        {label}
      </span>
      {children}
    </div>
  )
}

export function SettingsDivider() {
  return (
    <div data-component="settings-divider" className="margin-block-sm margin-inline-xl height-none
      rule ruled-top" />
  )
}

interface SettingsButtonProps {
  onClick: () => void
  children: ReactNode
}

export function SettingsButton({ onClick, children }: SettingsButtonProps) {
  return (
    <button
      data-component="settings-button"
      className="rigid padding-block-sm padding-inline-lg
        tween-quick
        ground-subtle ink rule corner-md ruled font-md font-medium pressable
        hover:ground-defined
        focus:ring
        active:ground-accent active:ink-inverse
        disabled:ground-subtle disabled:ink-soft disabled:blocked disabled:alpha-60"
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
