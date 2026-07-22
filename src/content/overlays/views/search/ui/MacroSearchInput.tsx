import React from 'react';
import { t } from '../../../../../lib/i18n';

interface MacroSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function MacroSearchInput({ value, onChange, inputRef }: MacroSearchInputProps) {
  return (
    <div data-component="search-input-container" className="padding-top-xs padding-bottom-md padding-right-xl padding-left-xl">
      <input
        ref={inputRef}
        type="text"
        data-component="search-input"
        value={value}
        onChange={e => onChange(e.currentTarget.value)}
        placeholder={t('modalSearch.inputPlaceholder')}
        className="padding-block-sm padding-inline-lg fill-inline
          tween-rule-quick
          ground-subtle ink rule corner-2xl ruled font-md recessed-soft
          focus:rule-accent-soft focus:ring-accent-soft"
      />
    </div>
  );
}
