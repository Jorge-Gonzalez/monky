export const SUGGESTIONS_OVERLAY_STYLES = `
  #macro-suggestions {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
  }
  
  #macro-suggestions * {
    box-sizing: border-box;
  }

  #macro-suggestions {
    position: fixed !important;
    z-index: 2147483646 !important;
  }

  .macro-suggestions-container {
    position: fixed !important;
    z-index: 9999 !important;
    background-color: var(--bg-primary);
    border-radius: 6px;
    box-shadow: 0 10px 25px -5px var(--shadow-color);
    border: 1px solid var(--border-primary);
    min-width: 200px;
    max-width: 300px;
    font-size: 14px;
    overflow: hidden;
  }

  .macro-suggestions-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.15s;
    border-bottom: 1px solid var(--border-secondary);
  }

  .macro-suggestions-item:last-of-type {
    border-bottom: none;
  }

  .macro-suggestions-item:hover {
    background-color: var(--bg-secondary);
  }

  .macro-suggestions-item.selected {
    background-color: var(--bg-tertiary);
    border-left: 2px solid var(--text-accent);
  }

  .macro-suggestions-item-content {
    flex: 1;
    min-width: 0;
  }

  .macro-suggestions-item-command {
    font-family: monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-accent);
    margin-bottom: 2px;
  }

  .macro-suggestions-item-text {
    font-size: 11px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .macro-suggestions-item-indicator {
    margin-left: 8px;
    font-size: 11px;
    color: var(--text-accent);
  }

  .macro-suggestions-footer {
    padding: 6px 12px;
    border-top: 1px solid var(--border-primary);
    font-size: 11px;
    color: var(--text-secondary);
    background-color: var(--bg-primary);
  }

  .macro-suggestions-kbd {
    padding: 1px 4px;
    border-radius: 3px;
    font-family: monospace;
    background-color: var(--kbd-bg);
    border: 1px solid var(--kbd-border);
    color: var(--text-primary);
    margin-right: 4px;
    font-size: 10px;
  }
`;