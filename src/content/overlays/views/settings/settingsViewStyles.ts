/**
 * Settings view specific styles
 *
 * This file contains ONLY styles distinctive to the settings view.
 * Shared patterns (section, buttons, inputs, prefix, replacement-mode) are in modalStyles.ts
 */
export const SETTINGS_VIEW_STYLES = `

  /* Settings view container - extends .scrollable pattern with specific layout */
  
  #monky-modal .settings-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  /* Custom scrollbar styles, this must be moved to the modalStyles.ts file and be inherited by this file */

  #monky-modal .settings-view::-webkit-scrollbar {
    width: var(--spacing-sm) !important;
    height: var(--spacing-sm) !important;
  }

  #monky-modal .settings-view::-webkit-scrollbar-track {
    background: var(--scrollbar-track) !important;
    border-radius: var(--radius-sm) !important;
  }

  #monky-modal .settings-view::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb) !important;
    border-radius: var(--radius-sm) !important;
    border: 1px solid var(--scrollbar-track) !important;
  }

  #monky-modal .settings-view::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover) !important;
  }

  /* Settings content padding wrapper */
  #monky-modal .settings-container {
    padding: var(--spacing-xl);
  }

  /* ===== Component-Specific Patterns ===== */

  /* Prefix Editor */

  #monky-modal .prefix-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  #monky-modal .prefix-button {
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    font-family: monospace;
    font-size: var(--text-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
    border: 1px solid var(--border-primary);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    outline: none;
  }

  #monky-modal .prefix-button:hover {
    background-color: var(--bg-tertiary);
  }

  #monky-modal .prefix-button:focus {
    box-shadow: 0 0 0 2px var(--text-accent);
  }

  #monky-modal .prefix-button.selected {
    background-color: var(--text-accent);
    color: white;
    border-color: var(--text-accent);
  }

  #monky-modal .prefix-button.shake {
    animation: prefix-shake 0.2s;
  }

  @keyframes prefix-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  /* Replacement Mode */

  #monky-modal .replacement-mode-options {
    display: flex;
    gap: var(--spacing-lg);
  }

  #monky-modal .replacement-mode-option {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  #monky-modal .replacement-mode-radio {
    margin-right: var(--spacing-sm);
    cursor: pointer;
    width: 16px;
    height: 16px;
    accent-color: var(--text-accent);
  }

  #monky-modal .replacement-mode-label {
    font-size: var(--text-md);
    color: var(--text-primary);
    cursor: pointer;
    user-select: none;
  }
`;
