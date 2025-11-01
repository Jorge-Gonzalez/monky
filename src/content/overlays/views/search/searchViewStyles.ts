/**
 * Styles specific to the macro search view
 *
 * Uses shared patterns from modalStyles.ts where possible
 * Only defines search-specific styles here
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
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-primary);
  }

  /* Search uses shared .input pattern from modalStyles */
  #monky-modal .macro-search-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-input);
    border-radius: var(--radius-md);
    font-size: var(--text-md);
    background-color: var(--bg-input);
    color: var(--text-primary);
    outline: none;
    box-sizing: border-box;
    transition: border-color var(--transition-fast);
  }

  #monky-modal .macro-search-input:focus {
    border-color: var(--text-accent);
    box-shadow: 0 0 0 2px var(--bg-tertiary);
  }

  /* Results container - extends .scrollable pattern */
  #monky-modal .macro-search-results {
    flex: 1;
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  #monky-modal .macro-search-results::-webkit-scrollbar {
    width: var(--spacing-sm) !important;
    height: var(--spacing-sm) !important;
  }

  #monky-modal .macro-search-results::-webkit-scrollbar-track {
    background: var(--scrollbar-track) !important;
    border-radius: var(--radius-sm) !important;
  }

  #monky-modal .macro-search-results::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb) !important;
    border-radius: var(--radius-sm) !important;
    border: 1px solid var(--scrollbar-track) !important;
  }

  #monky-modal .macro-search-results::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover) !important;
  }

  /* Empty state - uses shared .empty-state pattern */
  #monky-modal .macro-search-empty {
    padding: var(--spacing-lg);
    color: var(--text-secondary);
    text-align: center;
    font-size: var(--text-md);
  }

  /* Search result items - search-specific pattern */
  #monky-modal .macro-search-item {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color var(--transition-fast);
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
    font-size: var(--text-md);
  }

  #monky-modal .macro-search-item-text {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-top: var(--spacing-xs);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Footer */
  #monky-modal .macro-search-footer {
    padding: var(--spacing-sm);
    border-top: 1px solid var(--border-primary);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    display: flex;
    justify-content: space-between;
    background-color: var(--bg-primary);
  }

  /* Keyboard hints - uses shared .kbd pattern */
  #monky-modal .macro-search-kbd {
    padding: 2px var(--spacing-xs);
    border-radius: var(--radius-sm);
    font-family: monospace;
    background-color: var(--kbd-bg);
    border: 1px solid var(--kbd-border);
    color: var(--text-primary);
    margin-left: var(--spacing-xs);
  }

  #monky-modal .macro-search-kbd:first-child {
    margin-left: 0;
  }
`;
