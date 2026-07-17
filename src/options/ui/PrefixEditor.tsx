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
    <div className="section vertical gap-md padding-lg ground-subtle rule corner-md ruled">
      <h3 className="section-title font-lg">{t('options.prefixEditor.title')}</h3>
      <SelectableGroup
        options={ALL_PREFIXES}
        selected={prefixes}
        onChange={onChange}
        className="horizontal gap-sm wrap-allowed"
        buttonClassName="btn pressable padding-block-sm padding-inline-lg corner-md font-md font-medium focus:ring active:ground-accent active:ink-inverse disabled:blocked disabled:ground-subtle disabled:ink-soft disabled:alpha-60 ground ink ruled rule font-mono font-lg rigid prefix-cell control-box-3xl square"
      />
      <p className="section-description ink-soft font-md">{t('options.prefixEditor.description')}</p>
    </div>
  );
}
