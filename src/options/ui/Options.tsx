import React, { useState, useEffect } from 'react';
import { t } from '../../lib/i18n';
import PrefixEditor from './PrefixEditor';
import ReplacementMode from './ReplacementMode';
import { useOptionsManager, OptionsState } from '../managers/useOptionsManager';

export default function Options() {
  const manager = useOptionsManager();
  const [state, setState] = useState<OptionsState>(manager.getState());

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">{t('options.title')}</h1>
      <PrefixEditor manager={manager} prefixes={state.prefixes} />
      <ReplacementMode manager={manager} useCommitKeys={state.useCommitKeys} />
    </div>
  );
}