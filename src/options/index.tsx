import React from 'react'
import { createRoot } from 'react-dom/client'
import { PrefixEditor } from './ui/PrefixEditor'
import { useTheme } from '../hooks/useTheme';

// Wrapper component for the options page to apply theme and general layout
function OptionsPage() {
  useTheme(); // Apply the theme to the <html> tag
  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">Opciones de la Extensión</h1>
      <PrefixEditor />
    </div>
  );
}

const root = createRoot(document.getElementById('root')!)
root.render(<OptionsPage />)
