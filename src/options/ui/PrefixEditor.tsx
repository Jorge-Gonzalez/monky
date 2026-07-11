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
    <div className="section padding-relaxed rule corner-md ground-subtle">
      <h3 className="section-title font-lg ink">{t('options.prefixEditor.title')}</h3>
      <SelectableGroup
        options={ALL_PREFIXES}
        selected={prefixes}
        onChange={onChange}
        className="horizontal wrap-allowed gap-snug"
        buttonClassName="btn btn-outlined text-mono font-lg prefix-cell"
      />
      <p className="section-description ink-soft">{t('options.prefixEditor.description')}</p>
    </div>
  );
}
