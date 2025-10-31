import React from 'react';
import { ModalNavigationProps, ModalView } from '../types';

/**
 * ModalNavigation - Tab-based navigation for switching between modal views
 */
export function ModalNavigation({ currentView, onViewChange }: ModalNavigationProps) {
  const tabs: Array<{ view: ModalView; label: string; icon?: string }> = [
    { view: 'search', label: 'Search', icon: '🔍' },
    { view: 'editor', label: 'Editor', icon: '✏️' },
    { view: 'settings', label: 'Settings', icon: '⚙️' },
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
