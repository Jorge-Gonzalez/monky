import React from 'react';
import { ModalNavigationProps, ModalView } from '../types';
import { t } from '../../../../lib/i18n';

/**
 * Icon components
 */
const MonkyLogoDark = () => (
  <svg xmlns="http://www.w3.org/2000/svg" id="monky-logo-dark" width="32" height="32" viewBox="0 0 32 32">
    <path fill="currentColor" d="M18.4 2c-.2 0-.4 0-.6 .2-.4 .2-.8 .4-1.1 .7-.8 .6-1.7 1-3 1.3-2.6 .6-5.1 1.9-6.4 3.4-.7 .8-1.8 2.8-2 3.7-.1 .5-.2 .5-.6 .5-1.7 .1-3.3 1.1-4.1 2.6-.9 1.6-1 3.9 0 6 .7 1.6 2 3.1 3.9 3.5 .9 .2 .9 .2 1.4 1.1 1 1.7 3.1 3.5 6.3 4.2 3.9 .8 7.3 .3 10-1 1.8-.9 3-1.9 3.7-3.2 .4-.8 .6-1 .9-1 .6-.1 2.3-.8 3-1.5 1.4-1.3 2.1-3 2.1-5.8 0-1.8-.9-3-1.8-3.9-.5-.5-1.4-.9-2.4-1-.4 0-.6-.3-.7-.6-.6-1.9-1.8-3.5-3.4-4.6-.9-.6-.9-.7-.9-1.4 0-1.2-1-2.1-2.3-1.6-.4 .2-.5 .1-.8-.6-.1-.3-.6-1.2-1.4-1.2zm-.1 1.1h0c.5 .1 .5 2.3 .5 2.3 .3 .2 .7-.2 1-.4 .6-.4 1.7-.6 1.6 .4 0 .3-.1 .7-.1 .9-.1 .3 0 .4 .5 .6 1.9 .9 3.5 2.7 4.2 4.8 .2 .7 .5 1.1 1.2 1.1 2.7-.1 4.4 2.9 3.6 6-.6 2.2-2 3.6-3.9 3.9-.7 .1-.8 .2-1.3 1.1-.3 .5-.8 1.3-1.2 1.6-1.3 1.3-4 2.5-6.5 2.8-1.7 .2-3 .2-4.6-.1-3.6-.6-5.9-2.2-7-4.5-.4-.9-.5-1-1-1-.8 0-2.2-.7-2.9-1.5-1.2-1.4-1.7-3.7-1.2-5.3 .6-1.9 1.9-3.4 3.7-3.1 .4 0 .9-.2 1.1-.9 1.2-4.5 5.4-6.1 7.7-6.6 2.1-.5 2.9-.8 3.8-1.7 0 0 .3-.6 .6-.6zm-6.5 8.7c-2.7 0-4.2 2-4.2 3.7 0 .3 1.4-.1 3-.1 1.6-.1 3.9 0 4.5 .6h0c.4 .5 1.5 .4 2.2-.1 .8-.5 2.1-.6 5-.5 1.5 .1 2.5 .3 2.5-.1 0-1.5-.9-3.5-3.7-3.5-2.8 0-2.8 .9-4.7 .9-2.1 0-2.7-1-4.6-1zm-6.9 2.4c-1.2 0-2.3 1.5-2.3 3.1 0 1.6 .9 3.3 1.9 3.8 .7 .3 .9 .3 .9-.2 0-.2 .1-1.4 .5-2.3-.2-.7-.2-1.2-.3-1.7 0-.2-.5-.2-.8-.2-.8 0-.8-.9 0-.9 .6 0 .7-.3 .7-1.2 0-.4-.1-.5-.6-.5zm22.3 0c-.5 0-.5 0-.5 .7 0 .7 0 .9 .5 .9 .7 .1 .7 .9 .1 1-.3 .1-.5-.1-.6 0 0 .6-.2 1.5-.4 2.2 .5 1 .3 2.1 .4 2.2 .1 .2 .1 .2 .9-.2 1.6-.8 2.3-3.2 1.6-5.3-.3-.9-1.1-1.6-1.9-1.6zm-5.5 2.1a21 21 0 0 0-2.8 0c-.6 .1-1.3 .4-1.3 1.4 0 1.1 .5 2.2 1.2 2.6 .6 .4 2.2 .5 3 .2 .7-.2 1.2-.8 1.5-1.5 .3-.7 .3-2.2 0-2.5-.1-.1-.8-.2-1.7-.2zm-11.3 0c-.8 .1-1.7 0-1.8 .3-.2 .5-.2 1.3 .1 2.2 .3 .8 .5 1.1 1.4 1.5 .7 .4 2.5 .4 3.2 0 .7-.4 1.1-1.3 1.3-2.5 .1-1.2-.5-1.4-1.3-1.5a21 21 0 0 0-2.8-.1zm1.8 .4a1.4 1.5 0 0 1 1.4 1.5 1.4 1.5 0 0 1-1.4 1.5 1.4 1.5 0 0 1-1.4-1.5 1.4 1.5 0 0 1 1.4-1.5zm7.8 0a1.4 1.5 0 0 1 1.4 1.5 1.4 1.5 0 0 1-1.4 1.5 1.4 1.5 0 0 1-1.4-1.5 1.4 1.5 0 0 1 1.4-1.5zm-3.7 .8c-.1 0-.1 0-.2 0-.4 .1-.5 .1-.7 1.2-.5 2.4-2.3 3-4.6 3.1-.6 0-.7 1.4-.5 2.2 .4 1.7 1.6 2.6 4.1 3 3.4 .5 6.5-.4 7.3-2 .4-.9 .4-2.1 .1-2.7-.3-.5-.3-.5-1.3-.5-1.9-.1-3.5-1.2-3.6-3.2 0-.7-.2-.9-.6-1zm.7 3.4c.6 0 .8 .4 .4 .8-.6 .6-2.7 .3-2.7-.3 0-.4 .5-.6 1-.4 .2 .1 .7 0 1.1-.1 .1 0 .2 0 .3 0zm1.5 2.7c0 0 0 0 .1 0 .3 .2 .1 .7-.4 1-.9 .5-2.6 .5-3.4 .3-.5-.1-1.4-.6-1-1 .3-.3 .5-.1 1.4 .1 .9 .2 1.3 .3 2.1 0 .5-.1 1-.3 1.1-.3z"/>
  </svg>
);

const MonkyLogoLight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" id="monky-logo-light" width="32" height="32" viewBox="0 0 32 32">
    <path fill="currentColor" d="m11.8 11.8c-2.7 0-4.2 2-4.2 3.7 0 .3 1.4-.1 3-.1 1.6-.1 3.9 0 4.5 .6h0c.4 .5 1.5 .4 2.2-.1 .8-.5 2.1-.6 5-.5 1.5 .1 2.5 .3 2.5-.1 0-1.5-.9-3.5-3.7-3.5-2.8 0-2.8 .9-4.7 .9-2.1 0-2.7-1-4.6-1zm-6.9 2.3c-1.2 0-2.3 1.5-2.3 3.1 0 1.6 .9 3.3 1.9 3.8 .7 .3 .9 .3 .9-.2 0-.2 .1-1.4 .5-2.3-.2-.7-.2-1.2-.3-1.7 0-.2-.5-.2-.8-.2-.8 0-.8-.9 0-.9 .6 0 .7-.3 .7-1.2 0-.4-.1-.5-.6-.5zm22.3 0c-.5 0-.5 0-.5 .7 0 .7 0 .9 .5 .9 .7 .1 .7 .9 .1 1-.3 .1-.5-.1-.6 0 0 .6-.2 1.5-.4 2.2 .5 1 .3 2.1 .4 2.2 .1 .2 .1 .2 .9-.2 1.6-.8 2.3-3.2 1.6-5.3-.3-.9-1.1-1.6-1.9-1.6zm-7.3 2.6a1.4 1.5 0 0 1 1.4 1.5 1.4 1.5 0 0 1-1.4 1.5 1.4 1.5 0 0 1-1.4-1.5 1.4 1.5 0 0 1 1.4-1.5zm1.8-.4a21 21 0 0 0-2.8 0c-.6 .1-1.3 .4-1.3 1.4 0 1.1 .5 2.2 1.2 2.6 .6 .4 2.2 .5 3 .2 .7-.2 1.2-.8 1.5-1.5 .3-.7 .3-2.2 0-2.5-.1-.1-.8-.2-1.7-.2zm-9.6 .4a1.4 1.5 0 0 1 1.4 1.5 1.4 1.5 0 0 1-1.4 1.5 1.4 1.5 0 0 1-1.4-1.5 1.4 1.5 0 0 1 1.4-1.5zm-1.8-.4c-.8 .1-1.7 0-1.8 .3-.2 .5-.2 1.3 .1 2.2 .3 .8 .5 1.1 1.4 1.5 .7 .4 2.5 .4 3.2 0 .7-.4 1.1-1.3 1.3-2.5 .1-1.2-.5-1.4-1.3-1.5a21 21 0 0 0-2.8-.1zm6.6 4.6c.6 0 .8 .4 .4 .8-.6 .6-2.7 .3-2.7-.3 0-.4 .5-.6 1-.4 .2 .1 .7 0 1.1-.1 .1 0 .2 0 .3 0zM18.5 23.6c0 0 0 0 .1 0 .3 .2 .1 .7-.4 1-.9 .5-2.6 .5-3.4 .3-.5-.1-1.4-.6-1-1 .3-.3 .5-.1 1.4 .1 .9 .2 1.3 .3 2.1 0 .5-.1 1-.3 1.1-.3zm-2.3-6.1c-.1 0-.1 0-.2 0-.4 .1-.5 .1-.7 1.2-.5 2.4-2.3 3-4.6 3.1-.6 0-.7 1.4-.5 2.2 .4 1.7 1.6 2.6 4.1 3 3.4 .5 6.5-.4 7.3-2 .4-.9 .4-2.1 .1-2.7-.3-.5-.3-.5-1.3-.5-1.9-.1-3.5-1.2-3.6-3.2 0-.7-.2-.9-.6-1zM18.3 3.1c0 0 0 0 0 0 .5 .1 .5 2.3 .5 2.3 .3 .2 .7-.2 1-.4 .6-.4 1.7-.6 1.6 .4 0 .3-.1 .7-.1 .9-.1 .3 0 .4 .5 .6 1.9 .9 3.5 2.7 4.2 4.8 .2 .7 .5 1.1 1.2 1.1 2.7-.1 4.4 2.9 3.6 6-.6 2.2-2 3.6-3.9 3.9-.7 .1-.8 .2-1.3 1.1-.3 .5-.8 1.3-1.2 1.6-1.3 1.3-4 2.5-6.5 2.8-1.7 .2-3 .2-4.6-.1-3.6-.6-5.9-2.2-7-4.5-.4-.9-.5-1-1-1-.8 0-2.2-.7-2.9-1.5-1.2-1.4-1.7-3.7-1.2-5.3 .6-1.9 1.9-3.4 3.7-3.1 .4 0 .9-.2 1.1-.9 1.2-4.5 5.4-6.1 7.7-6.6 2.1-.5 2.9-.8 3.8-1.7 0 0 .3-.6 .6-.6z"/>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <circle cx="7" cy="7" r="4"/>
    <path stroke-width="2" stroke-linecap="round" d="M 11,11 13,13"/>
  </svg>
);

const EditorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 16 16">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width=".7" d="M10.3 3.7l1.9 1.9M2 14l0-.2c.1-.8.2-1.2.3-1.5.1-.3.3-.6.5-.9.2-.3.5-.6 1.1-1.2l7.8-7.8a1.3 1.3 0 0 1 1.9 1.9l-7.9 7.9c-.5.5-.8.8-1.1 1-.3.2-.5.3-.8.4-.3.1-.7.2-1.4.4L2 14Z M 8 14 14 14"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width=".7" d="M14.8 5.8 13.3 3.2C11.1 4.5 9.5 3.5 9.5 1h-3c0 2.5-1.6 3.5-3.8 2.2L1.2 5.8C3.4 7.1 3.4 8.9 1.2 10.2l1.5 2.6c2.2-1.3 3.8-.3 3.8 2.2h3c0-2.5 1.6-3.5 3.8-2.2l1.5-2.6c-2.2-1.3-2.2-3.1 0-4.4zM8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
  </svg>
);

/**
 * ModalNavigation - Tab-based navigation for switching between modal views
 */
export function ModalNavigation({ currentView, onViewChange, theme }: ModalNavigationProps) {
  const tabs: Array<{ view: ModalView; label: string; icon?: React.ReactNode }> = [
    { view: 'search', label: t('modalNavigation.search'), icon: <SearchIcon /> },
    { view: 'editor', label: t('modalNavigation.editor'), icon: <EditorIcon /> },
    { view: 'settings', label: t('modalNavigation.settings'), icon: <SettingsIcon /> },
  ];

  const isDarkMode = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const Logo = isDarkMode ? MonkyLogoDark : MonkyLogoLight;

  return (
    <nav data-component="modal-nav" className="horizontal padding-block-sm padding-inline-xl min-height-control-3xl align-center justify-between">
      <div data-component="modal-nav-brand" className="horizontal align-center ink-accent">
        <Logo />
      </div>
      <div data-component="modal-nav-tabs" className="horizontal gap-sm padding-xs ground-subtle corner-3xl">
        {tabs.map(tab => (
          <button
            key={tab.view}
            data-component="modal-nav-tab"
            className="tween-ground-ink-quick horizontal padding-none control-box-lg align-center justify-center ink-soft corner-3xl pressable hover:ink current:ground-defined current:ink-accent"
            onClick={() => onViewChange(tab.view)}
            aria-label={t('modalNavigation.switchTo', { view: tab.label })}
            aria-current={currentView === tab.view ? 'page' : undefined}
          >
            {tab.icon && <span className="rigid control-block-sm">{tab.icon}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
