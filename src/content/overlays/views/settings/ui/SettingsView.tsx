import React from 'react';
import { BaseModalViewProps } from '../../../modal/types';

/**
 * SettingsView - Configure extension settings
 *
 * Placeholder for settings management interface
 */
export function SettingsView({ onClose, onViewChange }: BaseModalViewProps) {
  return (
    <div className="settings-view">
      <div className="settings-container">
        <h2 className="settings-title">Settings</h2>
        <p className="settings-description">
          Extension settings will be managed here.
        </p>

        <div className="settings-placeholder">
          <div className="placeholder-icon">⚙️</div>
          <p>Settings interface coming soon...</p>
        </div>

        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
