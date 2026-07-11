import { t } from '../../lib/i18n';
import PrefixEditor from './PrefixEditor';
import ReplacementMode from './ReplacementMode';
import { useOptions } from '../useOptions';

export default function Options() {
  const { prefixes, useCommitKeys, setPrefixes, setUseCommitKeys } = useOptions();

  return (
    <div className="page-container">
      <h1 className="page-title font-2xl ink">{t('options.title')}</h1>
      <PrefixEditor prefixes={prefixes} onChange={setPrefixes} />
      <ReplacementMode useCommitKeys={useCommitKeys} onChange={setUseCommitKeys} />
    </div>
  );
}
