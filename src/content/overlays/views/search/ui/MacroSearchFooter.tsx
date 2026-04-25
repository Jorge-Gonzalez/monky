
interface MacroSearchFooterProps {
  count: number;
}

export function MacroSearchFooter({ count }: MacroSearchFooterProps) {
  return (
    <div className="macro-search-footer">
      <div className="macro-search-count">
        {count} {count === 1 ? 'macro' : 'macros'}
      </div>
      <div>
        <kbd className="macro-search-kbd">↑↓</kbd> navigate
        <kbd className="macro-search-kbd">&#8239;↵&#8239;</kbd> select
        <kbd className="macro-search-kbd">Esc</kbd> close
      </div>
    </div>
  );
}
