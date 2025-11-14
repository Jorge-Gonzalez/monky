import React from 'react';
import { createRoot } from 'react-dom/client';
import { MacroEditorExample } from '../src/shared/ui/examples/MacroEditorExample';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <MacroEditorExample />
  </React.StrictMode>
);
