import { useState, useEffect } from 'react';
import { BaseModalViewProps } from '../../../modal/types';
import { useOptionsCoordinator, OptionsState } from '../../../../../options';
import PrefixEditor from '../../../../../options/ui/PrefixEditor';
import ReplacementMode from '../../../../../options/ui/ReplacementMode';
import { t } from '../../../../../lib/i18n';

/**
 * SettingsView - Configure extension settings
 * Integrates options system into the modal using semantic CSS classes
 */
export function SettingsView(_props: BaseModalViewProps) {
  const coordinator = useOptionsCoordinator();
  const [state, setState] = useState<OptionsState>(coordinator.getState());

  useEffect(() => {
    const unsubscribe = coordinator.subscribe(setState);
    return unsubscribe;
  }, [coordinator]);

  return (
    <div className="settings-view">
      <div className="settings-container">
        <h1 className="view-title">{t('options.title')}</h1>
        <p className="view-description">
          Configure your macro extension preferences.
        </p>
        <PrefixEditor coordinator={coordinator} prefixes={state.prefixes} />
        <ReplacementMode coordinator={coordinator} useCommitKeys={state.useCommitKeys} />
      </div>
    </div>
  );
}
