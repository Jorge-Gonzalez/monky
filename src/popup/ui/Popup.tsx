import { useRef } from 'react';
import { t } from '../../lib/i18n';
import { MacroSearch } from './MacroSearch';
import SiteToggle from './SiteToggle';
import { useMacroStore } from '../../store/useMacroStore';
import ThemeSwitcher from './ThemeSwitcher';
import NewMacroButton from './NewMacroButton';
import { useThemeColors } from '../../theme/hooks/useThemeColors';

export default function Popup() {
  // Get all necessary state directly from the store.
  // This ensures the component re-renders whenever theme or macros change.
  const { theme, macros } = useMacroStore(state => ({
    theme: state.config.theme,
    macros: state.macros,
  }));

  const popupRef = useRef<HTMLDivElement>(null);
  // Apply theme colors using the reactive theme value from the store.
  useThemeColors(popupRef, theme, true);

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