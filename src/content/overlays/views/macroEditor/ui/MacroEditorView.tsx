import React from 'react';
import { BaseModalViewProps } from '../../../modal/types';

/**
 * MacroEditorView - Create and edit macros
 *
 * Placeholder for macro creation/editing interface
 */
export function MacroEditorView({ onClose, onViewChange }: BaseModalViewProps) {
  return (
    <div className="macro-editor-view">
      <div className="editor-container">
        <h2 className="editor-title">Macro Editor</h2>
        <p className="editor-description">
          Create and edit macros here.
        </p>

        <div className="editor-placeholder">
          <div className="placeholder-icon">✏️</div>
          <p>Macro editor interface coming soon...</p>
        </div>

        <div className="editor-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
