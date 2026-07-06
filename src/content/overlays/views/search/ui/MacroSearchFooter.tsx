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
    <div className="macro-search-footer padding-snug horizontal justify-between">
      <div className="macro-search-count">
        {countText}
      </div>
      <div>
        {isCommandMode ? (
          <>
            <span className="macro-search-shortcut horizontal inline align-center gap-snug"><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">↑</kbd><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">↓</kbd> {t('modalSearch.footer.navigate')}</span>
            <span className="macro-search-shortcut horizontal inline align-center gap-snug"><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">&#8239;↵&#8239;</kbd> {t('modalSearch.footer.run')}</span>
            <span className="macro-search-shortcut horizontal inline align-center gap-snug"><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">Esc</kbd> {t('modalSearch.footer.close')}</span>
          </>
        ) : (
          <>
            <span className="macro-search-shortcut horizontal inline align-center gap-snug"><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">:</kbd> {t('modalSearch.footer.commandsLabel')}</span>
            <span className="macro-search-shortcut horizontal inline align-center gap-snug"><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">↑</kbd><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">↓</kbd> {t('modalSearch.footer.navigate')}</span>
            <span className="macro-search-shortcut horizontal inline align-center gap-snug"><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">&#8239;↵&#8239;</kbd> {t('modalSearch.footer.select')}</span>
            {hasSelection && (
              <span className="macro-search-shortcut horizontal inline align-center gap-snug"><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">Tab</kbd> {t('modalSearch.footer.edit')}</span>
            )}
            <span className="macro-search-shortcut horizontal inline align-center gap-snug"><kbd className="macro-search-kbd position-relative horizontal align-center justify-center">Esc</kbd> {t('modalSearch.footer.close')}</span>
          </>
        )}
      </div>
    </div>
  );
}
