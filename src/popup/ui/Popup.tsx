import React, { useState, useEffect } from 'react';
import { t } from '../../lib/i18n';
import { MacroSearch } from './MacroSearch';
import SiteToggle from './SiteToggle';
import { usePopupManager } from '../managers/usePopupManager';
import ThemeSwitcher from './ThemeSwitcher';

export default function Popup() {
  const manager = usePopupManager();
  const [state, setState] = useState(manager.getState());

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  return (
    <div className="p-2 w-80 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-bold">{t('popup.title')}</h1>
        <ThemeSwitcher />
      </div>
      <SiteToggle />
      <MacroSearch macros={state.macros} />
    </div>
  );
}