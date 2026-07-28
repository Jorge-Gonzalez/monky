import type { RefObject } from 'react'
import { t } from '../../../../../lib/i18n'

interface MacroSearchInputProps {
  value: string
  onChange: (value: string) => void
  inputRef: RefObject<HTMLInputElement | null>
  /** Set only while a listbox of options is showing. */
  listboxId?: string
  /** The option the arrow keys have landed on, which keeps focus here rather than moving. */
  activeOptionId?: string
}

export function MacroSearchInput({
  value,
  onChange,
  inputRef,
  listboxId,
  activeOptionId,
}: MacroSearchInputProps) {
  return (
    <div
      data-component="search-input-container"
      className="padding-top-xs padding-bottom-md padding-right-xl padding-left-xl"
    >
      <input
        ref={inputRef}
        type="text"
        data-component="search-input"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={t('modalSearch.inputPlaceholder')}
        role="combobox"
        aria-expanded={Boolean(listboxId)}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        className="padding-block-sm padding-inline-lg fill-inline
          tween-rule-quick
          ground-subtle ink rule corner-3xl ruled font-md recessed-soft
          focus:rule-accent-soft focus:ring-accent-soft"
      />
    </div>
  )
}
