import React from 'react';
import { t } from '../../../../../lib/i18n';

interface MacroSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function MacroSearchInput({ value, onChange, inputRef }: MacroSearchInputProps) {
  return (
    <div className="macro-search-input-container padding-lg rule ruled-bottom">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={t('modalSearch.inputPlaceholder')}
        className="macro-search-input padding-block-sm padding-inline-md ground-subtle ink rule-accent-soft corner-md ruled font-md focus:rule-accent focus:ring"
      />
    </div>
  );
}
