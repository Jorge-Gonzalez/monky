/**
 * Styles specific to the macro search view
 */
export const SEARCH_VIEW_STYLES = `
  /* Search view container */
  #monky-modal .macro-search-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* Input container */
  #monky-modal .macro-search-input-container {
    padding: 16px;
    border-bottom: 1px solid var(--border-primary);
  }

  #monky-modal .macro-search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-input);
    border-radius: 6px;
    font-size: 14px;
    background-color: var(--bg-input);
    color: var(--text-primary);
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  #monky-modal .macro-search-input:focus {
    border-color: var(--text-accent);
    box-shadow: 0 0 0 2px var(--bg-tertiary);
  }

  /* Results container */
  #monky-modal .macro-search-results {
    flex: 1;
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  #monky-modal .macro-search-results::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
  }

  #monky-modal .macro-search-results::-webkit-scrollbar-track {
    background: var(--scrollbar-track) !important;
    border-radius: 4px !important;
  }

  #monky-modal .macro-search-results::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb) !important;
    border-radius: 4px !important;
    border: 1px solid var(--scrollbar-track) !important;
  }

  #monky-modal .macro-search-results::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover) !important;
  }

  #monky-modal .macro-search-empty {
    padding: 16px;
    color: var(--text-secondary);
    text-align: center;
    font-size: 14px;
  }

  /* Search result items */
  #monky-modal .macro-search-item {
    padding: 12px;
    border-bottom: 1px solid var(--border-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 0.15s;
  }

  #monky-modal .macro-search-item:hover {
    background-color: var(--bg-secondary);
  }

  #monky-modal .macro-search-item.selected {
    background-color: var(--bg-tertiary);
  }

  #monky-modal .macro-search-item-command {
    font-weight: 500;
    color: var(--text-accent);
    font-size: 14px;
  }

  #monky-modal .macro-search-item-text {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Footer */
  #monky-modal .macro-search-footer {
    padding: 8px;
    border-top: 1px solid var(--border-primary);
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    justify-content: space-between;
    background-color: var(--bg-primary);
  }

  #monky-modal .macro-search-kbd {
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
    background-color: var(--kbd-bg);
    border: 1px solid var(--kbd-border);
    color: var(--text-primary);
    margin-left: 4px;
  }

  #monky-modal .macro-search-kbd:first-child {
    margin-left: 0;
  }
`;
