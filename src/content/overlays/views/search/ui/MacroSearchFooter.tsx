interface MacroSearchFooterProps {
  count: number;
  isCommandMode: boolean;
}

export function MacroSearchFooter({ count, isCommandMode }: MacroSearchFooterProps) {
  return (
    <div className="macro-search-footer">
      <div className="macro-search-count">
        {count} {isCommandMode ? (count === 1 ? 'command' : 'commands') : (count === 1 ? 'macro' : 'macros')}
      </div>
      <div>
        {isCommandMode ? (
          <>
            <kbd className="macro-search-kbd">↑↓</kbd> navigate
            <kbd className="macro-search-kbd">&#8239;↵&#8239;</kbd> run
            <kbd className="macro-search-kbd">Esc</kbd> close
          </>
        ) : (
          <>
            <kbd className="macro-search-kbd">:</kbd> commands
            <kbd className="macro-search-kbd">↑↓</kbd> navigate
            <kbd className="macro-search-kbd">&#8239;↵&#8239;</kbd> select
            <kbd className="macro-search-kbd">Esc</kbd> close
          </>
        )}
      </div>
    </div>
  );
}
