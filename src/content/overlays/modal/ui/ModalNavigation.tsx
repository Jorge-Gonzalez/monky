import React from 'react';
import { ModalNavigationProps, ModalView } from '../types';

/**
 * Icon components
 */
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 20 20">
    <path fill="currentColor" fillRule="evenodd" d="M4 9a5 5 0 1 1 10 0A5 5 0 0 1 4 9zm5-7a7 7 0 1 0 4.2 12.6.999.999 0 0 0 .093.107l3 3a1 1 0 0 0 1.414-1.414l-3-3a.999.999 0 0 0-.107-.093A7 7 0 0 0 9 2z"/>
  </svg>
);

const EditorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15.5 5.5 2.828 2.83M13 21h8M3 21l.047-.332c.168-1.175.252-1.763.443-2.311.17-.487.401-.95.69-1.378.323-.482.743-.902 1.583-1.741L17.41 3.59a2 2 0 0 1 2.828 2.828L8.377 18.28c-.761.761-1.142 1.142-1.576 1.445-.385.269-.8.492-1.237.664-.492.193-1.02.3-2.076.513L3 21Z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path stroke="currentColor" strokeWidth="1.5" d="M13.765 2.152C13.398 2 12.932 2 12 2c-.932 0-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083c-.092.223-.129.484-.143.863a1.617 1.617 0 0 1-.79 1.353 1.617 1.617 0 0 1-1.567.008c-.336-.178-.579-.276-.82-.308a2 2 0 0 0-1.478.396C4.04 5.79 3.806 6.193 3.34 7c-.466.807-.7 1.21-.751 1.605a2 2 0 0 0 .396 1.479c.148.192.355.353.676.555.473.297.777.803.777 1.361 0 .558-.304 1.064-.777 1.36-.321.203-.529.364-.676.556a2 2 0 0 0-.396 1.479c.052.394.285.798.75 1.605.467.807.7 1.21 1.015 1.453a2 2 0 0 0 1.479.396c.24-.032.483-.13.819-.308a1.617 1.617 0 0 1 1.567.008c.483.28.77.795.79 1.353.014.38.05.64.143.863a2 2 0 0 0 1.083 1.083C10.602 22 11.068 22 12 22c.932 0 1.398 0 1.765-.152a2 2 0 0 0 1.083-1.083c.092-.223.129-.483.143-.863.02-.558.307-1.074.79-1.353a1.617 1.617 0 0 1 1.567-.008c.336.178.579.276.819.308a2 2 0 0 0 1.479-.396c.315-.242.548-.646 1.014-1.453.466-.807.7-1.21.751-1.605a2 2 0 0 0-.396-1.479c-.148-.192-.355-.353-.676-.555A1.617 1.617 0 0 1 19.562 12c0-.558.304-1.064.777-1.36.321-.203.529-.364.676-.556a2 2 0 0 0 .396-1.479c-.052-.394-.285-.798-.75-1.605-.467-.807-.7-1.21-1.015-1.453a2 2 0 0 0-1.479-.396c-.24.032-.483.13-.82.308a1.617 1.617 0 0 1-1.566-.008 1.617 1.617 0 0 1-.79-1.353c-.014-.38-.05-.64-.143-.863a2 2 0 0 0-1.083-1.083Z"/>
  </svg>
);

/**
 * ModalNavigation - Tab-based navigation for switching between modal views
 */
export function ModalNavigation({ currentView, onViewChange }: ModalNavigationProps) {
  const tabs: Array<{ view: ModalView; label: string; icon?: React.ReactNode }> = [
    { view: 'search', label: 'Search', icon: <SearchIcon /> },
    { view: 'editor', label: 'Editor', icon: <EditorIcon /> },
    { view: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <div className="modal-navigation">
      {tabs.map(tab => (
        <button
          key={tab.view}
          className={`modal-nav-tab ${currentView === tab.view ? 'active' : ''}`}
          onClick={() => onViewChange(tab.view)}
          aria-label={`Switch to ${tab.label}`}
          aria-current={currentView === tab.view ? 'page' : undefined}
        >
          {tab.icon && <span className="modal-nav-icon">{tab.icon}</span>}
          <span className="modal-nav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
