import React from 'react';
import { t } from '../../../../../lib/i18n';

interface MacroSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function MacroSearchInput({ value, onChange, inputRef }: MacroSearchInputProps) {
  return (
    <div data-component="search-input-container" className="padding-top-xs padding-right-xl padding-bottom-md padding-left-xl">
      <input
        ref={inputRef}
        type="text"
        data-component="search-input"
        value={value}
        onChange={e => onChange(e.currentTarget.value)}
        placeholder={t('modalSearch.inputPlaceholder')}
        className="fill-inline padding-block-sm padding-inline-lg ground-subtle ink rule corner-2xl ruled recessed-soft font-md tween-rule-quick focus:rule-accent-soft focus:ring-accent-soft"
      />
    </div>
  );
}
