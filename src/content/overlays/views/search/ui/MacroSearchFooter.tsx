import { useState } from 'react';
import { t } from '../../../../../lib/i18n';

interface MacroSearchFooterProps {
  count: number;
  isCommandMode: boolean;
  hasSelection?: boolean;
}

export function MacroSearchFooter({ count, isCommandMode, hasSelection }: MacroSearchFooterProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const countText = isCommandMode
    ? t(count === 1 ? 'modalSearch.footer.command' : 'modalSearch.footer.commands', { count })
    : t(count === 1 ? 'modalSearch.footer.macro' : 'modalSearch.footer.macros', { count });

  return (
    <div className="macro-search-footer horizontal padding-block-sm padding-inline-xl justify-between ground ink-soft font-sm">
      <div className="macro-search-count rigid text-nowrap tabular ink-soft">
        {countText}
      </div>
      <div className="horizontal gap-md align-center">
        {showShortcuts && (isCommandMode ? (
          <>
            <span className="macro-search-shortcut horizontal inline gap-sm align-center margin-right-lg"><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">↑</kbd><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">↓</kbd> {t('modalSearch.footer.navigate')}</span>
            <span className="macro-search-shortcut horizontal inline gap-sm align-center margin-right-lg"><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">&#8239;↵&#8239;</kbd> {t('modalSearch.footer.run')}</span>
            <span className="macro-search-shortcut horizontal inline gap-sm align-center"><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">Esc</kbd> {t('modalSearch.footer.close')}</span>
          </>
        ) : (
          <>
            <span className="macro-search-shortcut horizontal inline gap-sm align-center margin-right-lg"><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">:</kbd> {t('modalSearch.footer.commandsLabel')}</span>
            <span className="macro-search-shortcut horizontal inline gap-sm align-center margin-right-lg"><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">↑</kbd><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">↓</kbd> {t('modalSearch.footer.navigate')}</span>
            <span className="macro-search-shortcut horizontal inline gap-sm align-center margin-right-lg"><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">&#8239;↵&#8239;</kbd> {t('modalSearch.footer.select')}</span>
            {hasSelection && (
              <span className="macro-search-shortcut horizontal inline gap-sm align-center margin-right-lg"><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">Tab</kbd> {t('modalSearch.footer.edit')}</span>
            )}
            <span className="macro-search-shortcut horizontal inline gap-sm align-center"><kbd className="macro-search-kbd sf-keycap sf-keycap-raised horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">Esc</kbd> {t('modalSearch.footer.close')}</span>
          </>
        ))}
        <button
          type="button"
          className="macro-search-help horizontal rigid control-box-lg align-center justify-center ink-soft corner-3xl pressable hover:ground-defined hover:ink expanded:ground-defined expanded:ink-accent"
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
  );
}
