

export const NEW_SUGGESTIONS_OVERLAY_STYLES = `
  #new-macro-suggestions {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
  }
  
  #new-macro-suggestions * {
    box-sizing: border-box;
  }

  #new-macro-suggestions {
    position: fixed !important;
    z-index: 2147483646 !important;
  }

  .new-macro-suggestions-container {
    transition: top 0.1s ease-out;
    background-color: var(--bg-primary);
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px var(--shadow-color);
    border: 1px solid var(--border-primary);
    min-width: 200px;
    max-width: 300px;
    font-size: 14px;
    overflow: hidden;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .new-macro-suggestions-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border: 6px solid transparent;
  }

  .new-macro-suggestions-arrow.top {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: var(--bg-primary);
  }

  .new-macro-suggestions-arrow.bottom {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: var(--bg-primary);
  }

  .new-macro-suggestions-item {
    padding: 6px 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.15s;
    border-bottom: 1px solid var(--border-secondary);
  }

  .new-macro-suggestions-item:last-of-type {
    border-bottom: none;
  }

  .new-macro-suggestions-item:hover {
    background-color: var(--bg-secondary);
  }

  .new-macro-suggestions-item.selected {
    background-color: var(--bg-tertiary);
    border-left: 2px solid var(--text-accent);
  }

  .new-macro-suggestions-item-content {
    flex: 1;
    min-width: 0;
  }

    .new-macro-suggestions-commands-list {
    display: flex;
    padding: 4px;
    gap: 4px;
    border-bottom: 1px solid var(--border-secondary);
  }

  .new-macro-suggestions-command-item {
    flex-grow: 1;
    padding: 6px 10px;
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

  .new-macro-suggestions-command-item:hover {
    background-color: var(--bg-tertiary);
    border-color: var(--border-primary);
  }

  .new-macro-suggestions-command-item.selected {
    background-color: var(--bg-tertiary);
    color: var(--text-accent);
    border-color: var(--text-accent);
    box-shadow: 0 0 0 1px var(--text-accent);
  }

  .new-macro-suggestions-item-command {
    font-family: monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-accent);
    margin-bottom: 2px;
  }

  .new-macro-suggestions-item-text {
    font-size: 11px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .new-macro-suggestions-item-indicator {
    margin-left: 8px;
    font-size: 11px;
    color: var(--text-accent);
  }

  .new-macro-suggestions-text-preview {
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-secondary);
    min-height: 2.5em;
  }


  .new-macro-suggestions-footer {
    padding: 6px 12px;
    border-top: 1px solid var(--border-primary);
    font-size: 11px;
    color: var(--text-secondary);
    background-color: var(--bg-primary);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .new-macro-suggestions-kbd {
    padding: 1px 4px;
    border-radius: 3px;
    font-family: monospace;
    background-color: var(--kbd-bg);
    border: 1px solid var(--kbd-border);
    color: var(--text-primary);
    font-size: 10px;
  }
`;