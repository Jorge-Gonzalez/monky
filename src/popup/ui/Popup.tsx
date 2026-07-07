import { useRef } from 'react';
import { t } from '../../lib/i18n';
import { MacroSearch } from './MacroSearch';
import SiteToggle from './SiteToggle';
import { useMacroStore } from '../../store/useMacroStore';
import ThemeSwitcher from './ThemeSwitcher';
import NewMacroButton from './NewMacroButton';
import { useAppliedTheme } from '../../theme/hooks/useAppliedTheme';

export default function Popup() {
  const macros = useMacroStore(state => state.macros);

  const popupRef = useRef<HTMLDivElement>(null);
  useAppliedTheme(popupRef);

  return (
    <div ref={popupRef} className="vertical gap-snug padding-snug popup-container">
      <div className="horizontal justify-between align-center gap-snug">
        <div className="horizontal align-center gap-snug grow-1">
          <h1 className="text-lg font-bold">{t('popup.title')}</h1>
          <NewMacroButton />
        </div>
        <ThemeSwitcher />
      </div>
      <SiteToggle />
      <MacroSearch macros={macros} />
    </div>
  );
}