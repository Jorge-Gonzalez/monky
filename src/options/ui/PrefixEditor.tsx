import React, { useState } from 'react';
import { t } from '../../lib/i18n';
import { OptionsManager } from '../managers/createOptionsManager';

const ALL_PREFIXES = ['/', ';', ':', '#', '!'];

interface PrefixEditorProps {
  manager: OptionsManager;
  prefixes: string[];
}

export default function PrefixEditor({ manager, prefixes }: PrefixEditorProps) {
  const [shake, setShake] = useState<string | null>(null);

  const handlePrefixClick = (prefix: string) => {
    const isSelected = prefixes.includes(prefix);
    if (isSelected && prefixes.length === 1) {
      setShake(prefix);
      setTimeout(() => setShake(null), 400);
      return;
    }
    const newPrefixes = isSelected ? prefixes.filter(p => p !== prefix) : [...prefixes, prefix];
    manager.setPrefixes(newPrefixes);
  };

  return (
    <div className="p-4 border rounded-lg mt-4">
      <h3 className="font-bold mb-2">{t('options.prefixEditor.title')}</h3>
      <div className="flex flex-wrap gap-2">
        {ALL_PREFIXES.map(prefix => {
          const isSelected = prefixes.includes(prefix);
          return (
            <button
              key={prefix}
              type="button"
              role="switch"
              aria-checked={isSelected}
              onClick={() => handlePrefixClick(prefix)}
              className={`px-4 py-2 rounded-md font-mono text-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-inner'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              } ${shake === prefix ? 'animate-shake' : ''}`}
            >
              {prefix}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 mt-2">{t('options.prefixEditor.description')}</p>
    </div>
  );
}