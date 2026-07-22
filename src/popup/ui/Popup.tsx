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
    <div ref={popupRef} className="vertical gap-sm padding-sm width-popover-xl
      ground ink">
      <div className="horizontal gap-sm align-center justify-between">
        <div className="horizontal grow-1 gap-sm align-center">
          <h1 className="ink font-lg font-bold">{t('popup.title')}</h1>
          <NewMacroButton />
        </div>
        <ThemeSwitcher />
      </div>
      <SiteToggle />
      <MacroSearch macros={macros} />
    </div>
  );
}
