export const SEARCH_OVERLAY_STYLES = `
  #macro-search-overlay {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
  }
  
  #macro-search-overlay * {
    box-sizing: border-box;
  }

  #macro-search-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
  }
  
  #macro-search-overlay > * {
    pointer-events: auto !important;
  }

  .macro-search-backdrop {
    position: fixed;
    inset: 0;
    background-color: var(--shadow-color);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #macro-search-overlay .macro-search-modal {
    background-color: var(--bg-primary);
    border-radius: 8px;
    box-shadow: 0 25px 50px -12px var(--shadow-color);
    border: 1px solid var(--border-primary);
    min-width: 400px;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
  }

  #macro-search-overlay .macro-search-input-container {
    padding: 16px;
    border-bottom: 1px solid var(--border-primary);
  }

  #macro-search-overlay .macro-search-input {
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

  #macro-search-overlay .macro-search-input:focus {
    border-color: var(--text-accent);
    box-shadow: 0 0 0 2px var(--bg-tertiary);
  }

  #macro-search-overlay .macro-search-results {
    max-height: 300px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  #macro-search-overlay .macro-search-results::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
  }

  #macro-search-overlay .macro-search-results::-webkit-scrollbar-track {
    background: var(--scrollbar-track) !important;
    border-radius: 4px !important;
  }

  #macro-search-overlay .macro-search-results::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb) !important;
    border-radius: 4px !important;
    border: 1px solid var(--scrollbar-track) !important;
  }

  #macro-search-overlay .macro-search-results::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover) !important;
  }

  #macro-search-overlay .macro-search-empty {
    padding: 16px;
    color: var(--text-secondary);
    text-align: center;
    font-size: 14px;
  }

  #macro-search-overlay .macro-search-item {
    padding: 12px;
    border-bottom: 1px solid var(--border-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .macro-search-item:hover {
    background-color: var(--bg-secondary);
  }

  #macro-search-overlay .macro-search-item.selected {
    background-color: var(--bg-tertiary);
  }

  #macro-search-overlay .macro-search-item-command {
    font-weight: 500;
    color: var(--text-accent);
    font-size: 14px;
  }

  #macro-search-overlay .macro-search-item-text {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  #macro-search-overlay .macro-search-footer {
    padding: 8px;
    border-top: 1px solid var(--border-primary);
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    justify-content: space-between;
    background-color: var(--bg-primary);
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  #macro-search-overlay .macro-search-kbd {
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
    background-color: var(--kbd-bg);
    border: 1px solid var(--kbd-border);
    color: var(--text-primary);
    margin-left: 4px;
  }

  #macro-search-overlay .macro-search-kbd:first-child {
    margin-left: 0;
  }
`;