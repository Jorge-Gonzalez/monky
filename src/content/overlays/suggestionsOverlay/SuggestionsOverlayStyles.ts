

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
    transition: top 0.1s ease-out;
    background-color: var(--bg-primary);
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px var(--shadow-color);
    border: 1px solid var(--border-primary);
    min-width: 200px;
    max-width: 360px;
    font-size: 14px;
    overflow: hidden;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .macro-suggestions-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border: 6px solid transparent;
  }

  .macro-suggestions-arrow.top {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: var(--bg-primary);
  }

  .macro-suggestions-arrow.bottom {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: var(--bg-primary);
  }

  .macro-suggestions-item {
    padding: 6px 10px;
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
    border-left: 1px solid var(--text-accent);
  }

  .macro-suggestions-item-content {
    flex: 1;
    min-width: 0;
  }

    .macro-suggestions-commands-list {
    display: flex;
    padding: 4px;
    gap: 4px;
    border-bottom: 1px solid var(--border-secondary);
  }

  .macro-suggestions-command-item {
    flex-grow: 1;
    padding: 3px 6px 3px 6px;
    border: 1px solid transparent;
    border-radius: 6px;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 13px;
    font-family: monospace;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .macro-suggestions-command-item:hover {
    background-color: var(--bg-tertiary);
    border-color: var(--border-primary);
  }

  .macro-suggestions-command-item.selected {
    background-color: var(--bg-tertiary);
    color: var(--text-accent);
    border-color: var(--text-accent);
    outline: 2px solid var(--text-accent);
    outline-offset: 1px;
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

  .macro-suggestions-text-preview {
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-secondary);
    min-height: 2.5em;
  }


  .macro-suggestions-footer {
    padding: 6px 12px;
    border-top: 1px solid var(--border-primary);
    font-size: 11px;
    color: var(--text-secondary);
    background-color: var(--bg-primary);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .macro-suggestions-kbd {
    padding: 1px 4px;
    border-radius: 3px;
    font-family: monospace;
    background-color: var(--kbd-bg);
    border: 1px solid var(--kbd-border);
    color: var(--text-primary);
    font-size: 10px;
  }
`;