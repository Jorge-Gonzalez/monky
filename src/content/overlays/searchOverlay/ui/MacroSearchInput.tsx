import React from 'react';

interface MacroSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function MacroSearchInput({ value, onChange, inputRef }: MacroSearchInputProps) {
  return (
    <div className="macro-search-input-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search macros..."
        className="macro-search-input"
      />
    </div>
  );
}