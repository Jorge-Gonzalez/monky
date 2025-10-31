/**
 * Styles for the settings view
 */
export const SETTINGS_VIEW_STYLES = `
  #monky-modal .settings-view {
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  #monky-modal .settings-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  #monky-modal .settings-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }

  #monky-modal .settings-description {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 20px 0;
  }

  #monky-modal .settings-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    color: var(--text-secondary);
  }

  #monky-modal .placeholder-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  #monky-modal .settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border-primary);
  }

  #monky-modal .btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }

  #monky-modal .btn-secondary {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
  }

  #monky-modal .btn-secondary:hover {
    background-color: var(--bg-tertiary);
  }
`;
