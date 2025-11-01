/**
 * Shared styles for the unified modal system
 *
 * Architecture:
 * - Theme variables for spacing, sizing, and visual consistency
 * - Semantic component patterns shared across views
 * - View-specific styles remain in view style files
 */
export const MODAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Karla:wght@200&display=swap');

  /* ===== Theme Variables ===== */
  #monky-modal {
    /* Spacing scale */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 12px;
    --spacing-lg: 16px;
    --spacing-xl: 20px;
    --spacing-2xl: 24px;
    --spacing-3xl: 40px;

    /* Border radius scale */
    --radius-sm: 3px;
    --radius-md: 6px;
    --radius-lg: 8px;

    /* Font size scale */
    --text-xs: 11px;
    --text-sm: 12px;
    --text-base: 13px;
    --text-md: 14px;
    --text-lg: 15px;
    --text-xl: 18px;
    --text-2xl: 20px;

    /* Transition timing */
    --transition-fast: 0.15s;
  }

  /* ===== Root Container ===== */
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

  /* ===== Modal Infrastructure ===== */

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
    border-radius: var(--radius-lg);
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
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: var(--text-base);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
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
    font-size: var(--text-md);
  }

  #monky-modal .modal-nav-label {
    font-size: var(--text-base);
  }

  /* Content area */
  #monky-modal .modal-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ===== Shared Component Patterns ===== */

  #monky-modal h1 {
    font-family: 'Karla', sans-serif;
    font-size: var(--text-3xl);
    font-weight: 200;
    font-optical-sizing: auto;
  }

  /* View container pattern */
  #monky-modal .view-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--spacing-xl);
  }

  /* View header pattern */
  #monky-modal .view-title {
    font-size: var(--text-2xl);
    font-weight: 200;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  #monky-modal .view-description {
    font-size: var(--text-md);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-2xl) 0;
  }settings

  /* Section pattern - bordered container */
  #monky-modal .section {
    padding: var(--spacing-lg);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
    background-color: var(--bg-secondary);
  }

  #monky-modal .section-title {
    font-size: var(--text-lg);
    font-weight: 200;
    font-family: 'Karla', sans-serif;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-md) 0;
  }

  #monky-modal .section-description {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin: var(--spacing-sm) 0 0 0;
    line-height: 1.5;
  }

  /* Input pattern */
  #monky-modal .input {
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

  #monky-modal .input:focus {
    border-color: var(--text-accent);
    box-shadow: 0 0 0 2px var(--bg-tertiary);
  }

  /* Button patterns */
  #monky-modal .btn {
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    font-size: var(--text-md);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    border: none;
    outline: none;
  }

  #monky-modal .btn:focus {
    box-shadow: 0 0 0 2px var(--text-accent);
  }

  #monky-modal .btn-primary {
    background-color: var(--text-accent);
    color: white;
  }

  #monky-modal .btn-primary:hover {
    opacity: 0.9;
  }

  #monky-modal .btn-secondary {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
  }

  #monky-modal .btn-secondary:hover {
    background-color: var(--bg-tertiary);
  }

  /* Button group pattern */
  #monky-modal .button-group {
    display: flex;
    gap: var(--spacing-sm);
  }

  /* Scrollable content pattern */
  #monky-modal .scrollable {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  #monky-modal .scrollable::-webkit-scrollbar {
    width: var(--spacing-sm) !important;
    height: var(--spacing-sm) !important;
  }

  #monky-modal .scrollable::-webkit-scrollbar-track {
    background: var(--scrollbar-track) !important;
    border-radius: var(--radius-sm) !important;
  }

  #monky-modal .scrollable::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb) !important;
    border-radius: var(--radius-sm) !important;
    border: 1px solid var(--scrollbar-track) !important;
  }

  #monky-modal .scrollable::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover) !important;
  }

  /* Keyboard hint pattern */
  #monky-modal .kbd {
    padding: 2px var(--spacing-xs);
    border-radius: var(--radius-sm);
    font-family: monospace;
    background-color: var(--kbd-bg);
    border: 1px solid var(--kbd-border);
    color: var(--text-primary);
    margin-left: var(--spacing-xs);
    font-size: var(--text-xs);
  }

  #monky-modal .kbd:first-child {
    margin-left: 0;
  }

  /* Empty state pattern */
  #monky-modal .empty-state {
    padding: var(--spacing-lg);
    color: var(--text-secondary);
    text-align: center;
    font-size: var(--text-md);
  }

  /* Divider patterns */
  #monky-modal .divider-top {
    border-top: 1px solid var(--border-primary);
    padding-top: var(--spacing-lg);
  }

  #monky-modal .divider-bottom {
    border-bottom: 1px solid var(--border-primary);
    padding-bottom: var(--spacing-lg);
  }

  #monky-modal .divider {
    border: none;
    border-top: 1px solid var(--border-primary);
    margin: var(--spacing-2xl) 0;
  }

  /* ===== Extended Form Patterns ===== */

  /* Form labels */
  #monky-modal .label {
    display: block;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  /* Input states */
  #monky-modal .input-error {
    border-color: #dc2626;
  }

  #monky-modal .input-error:focus {
    border-color: #dc2626;
    box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
  }

  /* Checkbox */
  #monky-modal .checkbox {
    width: 16px;
    height: 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-input);
    cursor: pointer;
  }

  #monky-modal .checkbox:checked {
    accent-color: var(--text-accent);
  }

  #monky-modal .checkbox:focus {
    outline: 2px solid var(--text-accent);
    outline-offset: 2px;
  }

  /* Content editable areas */
  #monky-modal .editor-content {
    border: 1px solid var(--border-input);
    border-radius: var(--radius-md);
    background-color: var(--bg-input);
    color: var(--text-primary);
    padding: var(--spacing-md);
    min-height: 150px;
    outline: none;
    overflow: auto;
  }

  #monky-modal .editor-content:focus-within {
    border-color: var(--text-accent);
    box-shadow: 0 0 0 2px var(--bg-tertiary);
  }

  /* ===== Extended Button Patterns ===== */

  /* Success button */
  #monky-modal .btn-success {
    background-color: #16a34a;
    color: white;
  }

  #monky-modal .btn-success:hover {
    background-color: #15803d;
  }

  /* Danger button */
  #monky-modal .btn-danger {
    background-color: #dc2626;
    color: white;
  }

  #monky-modal .btn-danger:hover {
    background-color: #b91c1c;
  }

  /* Link-style buttons */
  #monky-modal .btn-link {
    background: none;
    border: none;
    color: var(--text-accent);
    text-decoration: none;
    font-size: var(--text-sm);
    padding: 0;
    cursor: pointer;
    font-weight: 400;
  }

  #monky-modal .btn-link:hover {
    text-decoration: underline;
  }

  #monky-modal .btn-link-danger {
    background: none;
    border: none;
    color: #dc2626;
    text-decoration: none;
    font-size: var(--text-sm);
    padding: 0;
    cursor: pointer;
    font-weight: 400;
  }

  #monky-modal .btn-link-danger:hover {
    text-decoration: underline;
  }

  /* Disabled button state */
  #monky-modal .btn:disabled {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: not-allowed;
    opacity: 0.6;
  }

  #monky-modal .btn:disabled:hover {
    background-color: var(--bg-secondary);
    opacity: 0.6;
  }

  /* ===== Alert/Feedback Patterns ===== */

  /* Base alert */
  #monky-modal .alert {
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    border: 1px solid;
    margin-bottom: var(--spacing-lg);
  }

  /* Error alert */
  #monky-modal .alert-error {
    background-color: rgba(220, 38, 38, 0.1);
    border-color: #dc2626;
    color: #dc2626;
  }

  /* Warning alert */
  #monky-modal .alert-warning {
    background-color: rgba(245, 158, 11, 0.1);
    border-color: #f59e0b;
    color: #d97706;
  }

  /* Info alert */
  #monky-modal .alert-info {
    background-color: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
    color: #2563eb;
  }

  /* Success alert */
  #monky-modal .alert-success {
    background-color: rgba(22, 163, 74, 0.1);
    border-color: #16a34a;
    color: #15803d;
  }

  /* Inline validation messages */
  #monky-modal .validation-error {
    color: #dc2626;
    font-size: var(--text-xs);
    margin-top: var(--spacing-xs);
  }

  #monky-modal .validation-success {
    color: #16a34a;
    font-size: var(--text-xs);
    margin-top: var(--spacing-xs);
  }

  /* ===== Card Patterns ===== */

  /* Card container */
  #monky-modal .card {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
  }

  /* Card with elevation */
  #monky-modal .card-elevated {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    box-shadow: 0 1px 3px 0 var(--shadow-color);
  }

  /* ===== Layout Utilities ===== */

  /* Vertical spacing */
  #monky-modal .space-y-xs > * + * {
    margin-top: var(--spacing-xs);
  }

  #monky-modal .space-y-sm > * + * {
    margin-top: var(--spacing-sm);
  }

  #monky-modal .space-y-md > * + * {
    margin-top: var(--spacing-md);
  }

  #monky-modal .space-y-lg > * + * {
    margin-top: var(--spacing-lg);
  }

  /* Horizontal gaps */
  #monky-modal .gap-xs {
    gap: var(--spacing-xs);
  }

  #monky-modal .gap-sm {
    gap: var(--spacing-sm);
  }

  #monky-modal .gap-md {
    gap: var(--spacing-md);
  }

  #monky-modal .gap-lg {
    gap: var(--spacing-lg);
  }

  /* Flex utilities */
  #monky-modal .flex {
    display: flex;
  }

  #monky-modal .inline-flex {
    display: inline-flex;
  }

  #monky-modal .items-center {
    align-items: center;
  }

  /* Typography utilities */
  #monky-modal .text-mono {
    font-family: monospace;
  }

  #monky-modal .font-medium {
    font-weight: 500;
  }

  #monky-modal .font-semibold {
    font-weight: 600;
  }
`;
