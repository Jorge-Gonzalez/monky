/**
 * MacroEditorExample - Interactive demonstration of macro editor components
 *
 * This example shows:
 * - Layer 1 primitives used individually
 * - Layer 2 coordinator (MacroEditorView) composing primitives
 * - Both creation and editing workflows
 */

import React, { useState, useRef } from 'react';
import {
  MacroEditorView,
  RichTextEditor,
  CommandInput,
  ToggleField,
  type MacroData,
  type RichTextEditorRef
} from '../index';

interface SavedMacro extends MacroData {
  id: string;
}

export function MacroEditorExample() {
  const [macros, setMacros] = useState<SavedMacro[]>([
    {
      id: '1',
      command: '/sig',
      text: 'Best regards,\nJohn Doe',
      contentType: 'text/plain'
    },
    {
      id: '2',
      command: '/addr',
      text: '123 Main St\nAnytown, USA',
      html: '<b>123 Main St</b><br>Anytown, USA',
      contentType: 'text/html'
    }
  ]);
  const [editingMacro, setEditingMacro] = useState<SavedMacro | null>(null);
  const [showPrimitives, setShowPrimitives] = useState(false);

  // Primitive component demo state
  const [demoCommand, setDemoCommand] = useState('/');
  const [demoContent, setDemoContent] = useState('');
  const [demoSensitive, setDemoSensitive] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async (data: MacroData, isEdit: boolean): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (isEdit && editingMacro) {
          setMacros(prev => prev.map(m =>
            m.id === editingMacro.id
              ? { ...data, id: m.id }
              : m
          ));
          setEditingMacro(null);
        } else {
          const newMacro: SavedMacro = {
            ...data,
            id: Date.now().toString()
          };
          setMacros(prev => [...prev, newMacro]);
        }
        resolve({ success: true });
      }, 500);
    });
  };

  const handleEdit = (macro: SavedMacro) => {
    setEditingMacro(macro);
  };

  const handleDelete = (id: string) => {
    setMacros(prev => prev.filter(m => m.id !== id));
  };

  const handleCancel = () => {
    setEditingMacro(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Macro Editor Components Demo</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowPrimitives(!showPrimitives)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showPrimitives ? 'Hide' : 'Show'} Primitive Components Demo
        </button>
      </div>

      {/* LAYER 1: PRIMITIVES DEMO */}
      {showPrimitives && (
        <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h2>Layer 1: Primitive Components</h2>
          <p style={{ color: '#666' }}>
            These are domain-agnostic building blocks that can be used anywhere.
          </p>

          <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
            {/* CommandInput Demo */}
            <div>
              <h3>CommandInput</h3>
              <CommandInput
                value={demoCommand}
                onChange={setDemoCommand}
                prefixes={['/', '#', '@']}
                label="Command"
                placeholder="e.g., /hello"
                showValidation={true}
              />
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                Value: <code>{demoCommand}</code>
              </div>
            </div>

            {/* RichTextEditor Demo */}
            <div>
              <h3>RichTextEditor</h3>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Content
              </label>
              <RichTextEditor
                ref={editorRef}
                value={demoContent}
                onChange={setDemoContent}
                placeholder="Type some rich text..."
              />
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => editorRef.current?.clear()}
                  style={{ padding: '4px 12px', fontSize: '14px' }}
                >
                  Clear
                </button>
                <button
                  onClick={() => console.log(editorRef.current?.getHTML())}
                  style={{ padding: '4px 12px', fontSize: '14px' }}
                >
                  Log HTML
                </button>
              </div>
            </div>

            {/* ToggleField Demo */}
            <div>
              <h3>ToggleField</h3>
              <ToggleField
                checked={demoSensitive}
                onChange={setDemoSensitive}
                label="Encrypt this macro"
                description="Sensitive macros are encrypted in storage"
              />
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                Checked: <code>{String(demoSensitive)}</code>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LAYER 2: COORDINATOR DEMO */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Layer 2: MacroEditorView (Coordinator)</h2>
        <p style={{ color: '#666' }}>
          {editingMacro
            ? `Editing macro: ${editingMacro.command}`
            : 'Create a new macro'}
        </p>

        <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}>
          <MacroEditorView
            prefixes={['/', '#', '@']}
            initialData={editingMacro || undefined}
            onSubmit={handleSubmit}
            onCancel={editingMacro ? handleCancel : undefined}
            config={{
              command: {
                label: 'Trigger Command',
                placeholder: 'e.g., /sig',
                maxLength: 50
              },
              editor: {
                label: 'Macro Content',
                placeholder: 'Enter your macro content with rich formatting...'
              },
              sensitive: {
                label: 'Mark as sensitive',
                description: 'Sensitive macros will be encrypted'
              },
              submit: {
                createLabel: 'Create Macro',
                updateLabel: 'Update Macro',
                cancelLabel: 'Cancel Edit'
              }
            }}
          />
        </div>
      </section>

      {/* SAVED MACROS LIST */}
      <section>
        <h2>Saved Macros ({macros.length})</h2>

        {macros.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>
            No macros yet. Create one above!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {macros.map(macro => (
              <div
                key={macro.id}
                style={{
                  padding: '16px',
                  backgroundColor: editingMacro?.id === macro.id ? '#e7f3ff' : '#f8f9fa',
                  border: editingMacro?.id === macro.id ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                      <code style={{
                        padding: '4px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {macro.command}
                      </code>

                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: macro.contentType === 'text/html' ? '#28a745' : '#6c757d',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {macro.contentType === 'text/html' ? 'Rich Text' : 'Plain Text'}
                      </span>

                      {macro.is_sensitive && (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          🔒 Encrypted
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                      <strong>Plain Text:</strong>
                      <pre style={{
                        marginTop: '4px',
                        padding: '8px',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {macro.text}
                      </pre>
                    </div>

                    {macro.html && (
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                        <strong>HTML Preview:</strong>
                        <div
                          style={{
                            marginTop: '4px',
                            padding: '8px',
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                          dangerouslySetInnerHTML={{ __html: macro.html }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button
                      onClick={() => handleEdit(macro)}
                      disabled={editingMacro?.id === macro.id}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: editingMacro?.id === macro.id ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: editingMacro?.id === macro.id ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {editingMacro?.id === macro.id ? 'Editing...' : 'Edit'}
                    </button>

                    <button
                      onClick={() => handleDelete(macro.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ARCHITECTURE INFO */}
      <section style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f0f7ff', borderRadius: '8px' }}>
        <h2>3-Layer Architecture</h2>
        <div style={{ display: 'grid', gap: '16px', fontSize: '14px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#007bff' }}>Layer 1: Primitives</h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><code>RichTextEditor</code> - Medium editor wrapper</li>
              <li><code>CommandInput</code> - Prefix-validated input</li>
              <li><code>ToggleField</code> - Boolean toggle with label</li>
            </ul>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#28a745' }}>Layer 2: Coordinator</h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><code>useMacroEditorCoordination</code> - State machine + validation</li>
              <li><code>MacroEditorView</code> - Thin coordinator component</li>
            </ul>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#6c757d' }}>Layer 3: Domain</h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><code>MacroForm</code> - Your existing form (unchanged)</li>
              <li>Or use <code>MacroEditorView</code> directly</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
