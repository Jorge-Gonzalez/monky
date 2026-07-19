import React from 'react';
import { t } from '../../../../../lib/i18n';

interface MacroSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function MacroSearchInput({ value, onChange, inputRef }: MacroSearchInputProps) {
  return (
    <div className="macro-search-input-container padding-top-xs padding-right-xl padding-bottom-md padding-left-xl">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={t('modalSearch.inputPlaceholder')}
        className="macro-search-input fill-inline padding-block-sm padding-inline-lg ground-subtle ink rule corner-2xl ruled recessed-soft font-md tween-rule-quick focus:rule-accent-soft focus:ring-accent-soft"
      />
    </div>
  );
}
