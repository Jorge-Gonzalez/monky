import React, { useState } from 'react';
import { t } from '../../lib/i18n';
import { OptionsCoordinator } from '../coordinators/optionsCoordinator';

const ALL_PREFIXES = ['/', ';', ':', '#', '!'];

interface PrefixEditorProps {
  coordinator: OptionsCoordinator;
  prefixes: string[];
}

/**
 * PrefixEditor - Configure macro trigger prefixes
 * Uses semantic CSS classes compatible with modal system
 */
export default function PrefixEditor({ coordinator, prefixes }: PrefixEditorProps) {
  const [shake, setShake] = useState<string | null>(null);

  const handlePrefixClick = (prefix: string) => {
    const isSelected = prefixes.includes(prefix);
    if (isSelected && prefixes.length === 1) {
      setShake(prefix);
      setTimeout(() => setShake(null), 400);
      return;
    }
    const newPrefixes = isSelected ? prefixes.filter(p => p !== prefix) : [...prefixes, prefix];
    coordinator.setPrefixes(newPrefixes);
  };

  return (
    <div className="section">
      <h3 className="section-title">{t('options.prefixEditor.title')}</h3>
      <div className="prefix-options">
        {ALL_PREFIXES.map(prefix => {
          const isSelected = prefixes.includes(prefix);
          return (
            <button
              key={prefix}
              type="button"
              role="switch"
              aria-checked={isSelected}
              onClick={() => handlePrefixClick(prefix)}
              className={`prefix-button ${isSelected ? 'selected' : ''} ${shake === prefix ? 'shake' : ''}`}
            >
              {prefix}
            </button>
          );
        })}
      </div>
      <p className="section-description">{t('options.prefixEditor.description')}</p>
    </div>
  );
}