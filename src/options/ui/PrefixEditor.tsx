import { useState } from 'react';
import { t } from '../../lib/i18n';

const ALL_PREFIXES = ['/', ';', ':', '#', '!'];

interface PrefixEditorProps {
  prefixes: string[];
  /** Toggle a prefix; returns false if the change was rejected (last one). */
  onToggle: (prefix: string) => boolean;
}

/**
 * PrefixEditor - Configure macro trigger prefixes. Presentational: owns only the
 * shake feedback; the toggle rule lives in the caller.
 */
export default function PrefixEditor({ prefixes, onToggle }: PrefixEditorProps) {
  const [shake, setShake] = useState<string | null>(null);

  const handlePrefixClick = (prefix: string) => {
    if (!onToggle(prefix)) {
      setShake(prefix);
      setTimeout(() => setShake(null), 400);
    }
  };

  return (
    <div className="section">
      <h3 className="section-title">{t('options.prefixEditor.title')}</h3>
      <div className="horizontal blocks equal-square wrap-allowed snug selectable-group min-selected-1">
        {ALL_PREFIXES.map(prefix => {
          const isSelected = prefixes.includes(prefix);
          return (
            <button
              key={prefix}
              type="button"
              role="switch"
              aria-checked={isSelected}
              onClick={() => handlePrefixClick(prefix)}
              className={`btn btn-outlined text-mono text-lg ${isSelected ? 'is-selected' : ''} ${shake === prefix ? 'shake' : ''}`}
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
