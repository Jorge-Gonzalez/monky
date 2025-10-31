import React from 'react';

export function MacroSearchFooter() {
  return (
    <div className="macro-search-footer">
      <div>
        <kbd className="macro-search-kbd">↑↓</kbd> navigate
        <kbd className="macro-search-kbd">&#8239;↵&#8239;</kbd> select
      </div>
      <div>
        <kbd className="macro-search-kbd">Esc</kbd> close
      </div>
    </div>
  );
}