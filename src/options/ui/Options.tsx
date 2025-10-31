import { useState, useEffect } from 'react';
import { t } from '../../lib/i18n';
import PrefixEditor from './PrefixEditor';
import ReplacementMode from './ReplacementMode';
import { useOptionsCoordinator, OptionsState } from '../hooks/useOptionsCoordinator';

export default function Options() {
  const coordinator = useOptionsCoordinator();
  const [state, setState] = useState<OptionsState>(coordinator.getState());

  useEffect(() => {
    const unsubscribe = coordinator.subscribe(setState);
    return unsubscribe;
  }, [coordinator]);

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">{t('options.title')}</h1>
      <PrefixEditor coordinator={coordinator} prefixes={state.prefixes} />
      <ReplacementMode coordinator={coordinator} useCommitKeys={state.useCommitKeys} />
    </div>
  );
}