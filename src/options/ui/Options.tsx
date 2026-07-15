import { t } from '../../lib/i18n';
import PrefixEditor from './PrefixEditor';
import ReplacementMode from './ReplacementMode';
import { useOptions } from '../useOptions';

export default function Options() {
  const { prefixes, useCommitKeys, setPrefixes, setUseCommitKeys } = useOptions();

  return (
    <div className="page-container vertical gap-lg padding-2xl max-width-2xl">
      <h1 className="page-title font-2xl">{t('options.title')}</h1>
      <PrefixEditor prefixes={prefixes} onChange={setPrefixes} />
      <ReplacementMode useCommitKeys={useCommitKeys} onChange={setUseCommitKeys} />
    </div>
  );
}
