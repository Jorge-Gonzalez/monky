import { t } from '../../../../../lib/i18n';

interface MacroSearchFooterProps {
  count: number;
  isCommandMode: boolean;
  hasSelection?: boolean;
}

export function MacroSearchFooter({ count, isCommandMode, hasSelection }: MacroSearchFooterProps) {
  const countText = isCommandMode
    ? t(count === 1 ? 'modalSearch.footer.command' : 'modalSearch.footer.commands', { count })
    : t(count === 1 ? 'modalSearch.footer.macro' : 'modalSearch.footer.macros', { count });

  return (
    <div className="macro-search-footer horizontal padding-snug justify-between ground ink-soft rule ruled-top font-sm">
      <div className="macro-search-count ink-soft">
        {countText}
      </div>
      <div>
        {isCommandMode ? (
          <>
            <span className="macro-search-shortcut horizontal inline gap-snug align-center"><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">↑</kbd><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">↓</kbd> {t('modalSearch.footer.navigate')}</span>
            <span className="macro-search-shortcut horizontal inline gap-snug align-center"><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">&#8239;↵&#8239;</kbd> {t('modalSearch.footer.run')}</span>
            <span className="macro-search-shortcut horizontal inline gap-snug align-center"><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">Esc</kbd> {t('modalSearch.footer.close')}</span>
          </>
        ) : (
          <>
            <span className="macro-search-shortcut horizontal inline gap-snug align-center"><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">:</kbd> {t('modalSearch.footer.commandsLabel')}</span>
            <span className="macro-search-shortcut horizontal inline gap-snug align-center"><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">↑</kbd><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">↓</kbd> {t('modalSearch.footer.navigate')}</span>
            <span className="macro-search-shortcut horizontal inline gap-snug align-center"><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">&#8239;↵&#8239;</kbd> {t('modalSearch.footer.select')}</span>
            {hasSelection && (
              <span className="macro-search-shortcut horizontal inline gap-snug align-center"><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">Tab</kbd> {t('modalSearch.footer.edit')}</span>
            )}
            <span className="macro-search-shortcut horizontal inline gap-snug align-center"><kbd className="macro-search-kbd horizontal align-center justify-center position-relative ground ink-soft rule-soft ruled font-xs font-mono">Esc</kbd> {t('modalSearch.footer.close')}</span>
          </>
        )}
      </div>
    </div>
  );
}
