// Addendum to the suggestions-overlay styles: the delete-confirm popup reuses the
// suggestions container/footer/kbd look and only adds its message row and the
// danger styling for the Delete option.
export const DELETE_CONFIRM_STYLES = `
.macro-suggestions-container.delete-confirm {
  min-width: 240px;
}

.delete-confirm-message {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--ink);
  border-bottom: 1px solid var(--harmonic-minor);
}

.delete-confirm-command {
  font-family: monospace;
  font-weight: 600;
  color: var(--accent);
}

.macro-suggestions-command-item.delete-confirm-option {
  flex: 1 1 0;
  max-width: none;
}

.macro-suggestions-command-item.delete-confirm-danger.selected {
  background-color: var(--status-error-wash);
  color: var(--status-error);
  border-color: var(--status-error);
}
`
