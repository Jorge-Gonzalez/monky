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
    <div ref={popupRef} className="p-2 popup-container">
      <div className="flex justify-between items-center mb-2 gap-2">
        <div className="flex items-center gap-2 grow">
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