/**
 * Styles for the macro editor view
 */
export const EDITOR_VIEW_STYLES = `
  #monky-modal .macro-editor-view {
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  #monky-modal .editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  #monky-modal .editor-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }

  #monky-modal .editor-description {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 20px 0;
  }

  #monky-modal .editor-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    color: var(--text-secondary);
  }

  #monky-modal .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border-primary);
  }
`;
