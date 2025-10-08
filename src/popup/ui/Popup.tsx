import React from 'react';
import { PopupManager } from '../managers/createPopupManager';
import { t } from '../../lib/i18n';
import { MacroSearch } from './MacroSearch';
import SiteToggle from './SiteToggle';

interface PopupProps {
  manager: PopupManager;
}

export default function Popup({ manager }: PopupProps) { // Note: This component is not fully refactored yet.
  const [state, setState] = React.useState(manager.getState());

  React.useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    manager.setTheme(theme);
  };

  return (
    <div className="popup">
      <div className="popup-header">
        <h1>{t('popup.title')}</h1>
        <div className="popup-sync-status">
          <span>{t('popup.synced')}</span>
        </div>
        <div className="popup-theme-buttons">
          <button onClick={() => handleThemeChange('light')}>☀️</button>
          <button onClick={() => handleThemeChange('dark')}>🌙</button>
        </div>
      </div>
      
      <SiteToggle />
      
      <MacroSearch macros={state.macros} />
    </div>
  );
}