import { t } from '../../lib/i18n';
import { SelectableGroup } from '../../shared/ui/SelectableGroup';

const ALL_PREFIXES = ['/', ';', ':', '#', '!'];

interface PrefixEditorProps {
  prefixes: string[];
  onChange: (next: string[]) => void;
}

/**
 * PrefixEditor - the prefix section: title, the selectable prefix group, description.
 */
export default function PrefixEditor({ prefixes, onChange }: PrefixEditorProps) {
  return (
    <div className="section">
      <h3 className="section-title">{t('options.prefixEditor.title')}</h3>
      <SelectableGroup
        options={ALL_PREFIXES}
        selected={prefixes}
        onChange={onChange}
        className="horizontal blocks equal-square wrap-allowed snug"
        buttonClassName="btn btn-outlined text-mono text-lg"
      />
      <p className="section-description">{t('options.prefixEditor.description')}</p>
    </div>
  );
}
