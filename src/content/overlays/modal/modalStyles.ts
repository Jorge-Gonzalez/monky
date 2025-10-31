/**
 * Shared styles for the unified modal system
 * Extracted from search overlay styles and generalized
 */
export const MODAL_STYLES = `
  /* Root container */
  #monky-modal {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
  }

  #monky-modal * {
    box-sizing: border-box;
  }

  #monky-modal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
  }

  #monky-modal > * {
    pointer-events: auto !important;
  }

  /* Backdrop - full screen overlay */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: var(--shadow-color);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Dialog - the modal container */
  #monky-modal .modal-dialog {
    background-color: var(--bg-primary);
    border-radius: 8px;
    box-shadow: 0 25px 50px -12px var(--shadow-color);
    border: 1px solid var(--border-primary);
    min-width: 400px;
    max-width: 600px;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Navigation tabs */
  #monky-modal .modal-navigation {
    display: flex;
    border-bottom: 1px solid var(--border-primary);
    background-color: var(--bg-primary);
  }

  #monky-modal .modal-nav-tab {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-bottom: 2px solid transparent;
  }

  #monky-modal .modal-nav-tab:hover {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }

  #monky-modal .modal-nav-tab.active {
    color: var(--text-accent);
    border-bottom-color: var(--text-accent);
    background-color: var(--bg-secondary);
  }

  #monky-modal .modal-nav-icon {
    font-size: 14px;
  }

  #monky-modal .modal-nav-label {
    font-size: 13px;
  }

  /* Content area */
  #monky-modal .modal-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Common scrollbar styles */
  #monky-modal .scrollable {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  #monky-modal .scrollable::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
  }

  #monky-modal .scrollable::-webkit-scrollbar-track {
    background: var(--scrollbar-track) !important;
    border-radius: 4px !important;
  }

  #monky-modal .scrollable::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb) !important;
    border-radius: 4px !important;
    border: 1px solid var(--scrollbar-track) !important;
  }

  #monky-modal .scrollable::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover) !important;
  }

  /* Common input styles */
  #monky-modal .modal-input {
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

  #monky-modal .modal-input:focus {
    border-color: var(--text-accent);
    box-shadow: 0 0 0 2px var(--bg-tertiary);
  }

  /* Keyboard hint styles */
  #monky-modal .kbd {
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
    background-color: var(--kbd-bg);
    border: 1px solid var(--kbd-border);
    color: var(--text-primary);
    margin-left: 4px;
    font-size: 11px;
  }

  #monky-modal .kbd:first-child {
    margin-left: 0;
  }
`;
