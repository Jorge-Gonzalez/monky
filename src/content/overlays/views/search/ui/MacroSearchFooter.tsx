import { t } from '../../../../../lib/i18n';

interface MacroSearchFooterProps {
  count: number;
  isCommandMode: boolean;
}

export function MacroSearchFooter({ count, isCommandMode }: MacroSearchFooterProps) {
  const countText = isCommandMode
    ? t(count === 1 ? 'modalSearch.footer.command' : 'modalSearch.footer.commands', { count })
    : t(count === 1 ? 'modalSearch.footer.macro' : 'modalSearch.footer.macros', { count });

  return (
    <div className="macro-search-footer">
      <div className="macro-search-count">
        {countText}
      </div>
      <div>
        {isCommandMode ? (
          <>
            <kbd className="macro-search-kbd">↑↓</kbd> {t('modalSearch.footer.navigate')}
            <kbd className="macro-search-kbd">&#8239;↵&#8239;</kbd> {t('modalSearch.footer.run')}
            <kbd className="macro-search-kbd">Esc</kbd> {t('modalSearch.footer.close')}
          </>
        ) : (
          <>
            <kbd className="macro-search-kbd">:</kbd> {t('modalSearch.footer.commandsLabel')}
            <kbd className="macro-search-kbd">↑↓</kbd> {t('modalSearch.footer.navigate')}
            <kbd className="macro-search-kbd">&#8239;↵&#8239;</kbd> {t('modalSearch.footer.select')}
            <kbd className="macro-search-kbd">Esc</kbd> {t('modalSearch.footer.close')}
          </>
        )}
      </div>
    </div>
  );
}
