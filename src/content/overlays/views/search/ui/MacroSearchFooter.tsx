import { useState } from 'react'
import { t } from '../../../../../lib/i18n'
import { ShortcutHint } from '../../../../../shared/ui/Keycap'

interface MacroSearchFooterProps {
  count: number
  isCommandMode: boolean
  hasSelection?: boolean
}

export function MacroSearchFooter({ count, isCommandMode, hasSelection }: MacroSearchFooterProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const countText = isCommandMode
    ? t(count === 1 ? 'modalSearch.footer.command' : 'modalSearch.footer.commands', { count })
    : t(count === 1 ? 'modalSearch.footer.macro' : 'modalSearch.footer.macros', { count })

  return (
    <div data-component="search-footer" className="horizontal padding-block-sm padding-inline-xl justify-between
      ground ink-soft font-sm">
      <div data-component="search-footer-count" className="rigid
        ink-soft tabular text-nowrap">
        {countText}
      </div>
      <div data-component="search-footer-hints" className="horizontal gap-md align-center">
        {showShortcuts && (isCommandMode ? (
          <>
            <ShortcutHint keys={['↑', '↓']} label={t('modalSearch.footer.navigate')} />
            <ShortcutHint keys={['\u2009↵\u2009']} label={t('modalSearch.footer.run')} />
            <ShortcutHint keys={['Esc']} label={t('modalSearch.footer.close')} last />
          </>
        ) : (
          <>
            <ShortcutHint keys={[':']} label={t('modalSearch.footer.commandsLabel')} />
            <ShortcutHint keys={['↑', '↓']} label={t('modalSearch.footer.navigate')} />
            <ShortcutHint keys={['\u2009↵\u2009']} label={t('modalSearch.footer.select')} />
            {hasSelection && (
              <ShortcutHint keys={['Tab']} label={t('modalSearch.footer.edit')} />
            )}
            <ShortcutHint keys={['Esc']} label={t('modalSearch.footer.close')} last />
          </>
        ))}
        <button
          type="button"
          data-component="search-footer-toggle"
          className="horizontal rigid align-center justify-center control-box-lg
            ink-soft corner-3xl pressable
            hover:ground-defined hover:ink
            expanded:ground-defined expanded:ink-accent"
          aria-label={t(showShortcuts ? 'modalSearch.footer.hideShortcuts' : 'modalSearch.footer.showShortcuts')}
          aria-expanded={showShortcuts}
          onClick={() => setShowShortcuts(value => !value)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" />
            <path d="M6.7 6.1a1.5 1.5 0 1 1 2.6 1c-.8.7-1.3 1-1.3 2" stroke="currentColor" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r=".65" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}
