import { useState, useEffect } from 'react';
import { t } from '../../lib/i18n';
import PrefixEditor from './PrefixEditor';
import ReplacementMode from './ReplacementMode';
import { useOptionsCoordinator, OptionsState } from '../index';

export default function Options() {
  const coordinator = useOptionsCoordinator();
  const [state, setState] = useState<OptionsState>(coordinator.getState());

  useEffect(() => {
    const unsubscribe = coordinator.subscribe(setState);
    return unsubscribe;
  }, [coordinator]);

  return (
    <div className="page-container">
      <h1 className="page-title">{t('options.title')}</h1>
      <PrefixEditor coordinator={coordinator} prefixes={state.prefixes} />
      <ReplacementMode coordinator={coordinator} useCommitKeys={state.useCommitKeys} />
    </div>
  );
}