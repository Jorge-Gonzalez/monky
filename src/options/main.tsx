import React from 'react'
import { PrefixEditor } from './ui/PrefixEditor'
import { BehaviorEditor } from './ui/BehaviorEditor'
import { renderPage } from '../lib/renderPage'

function OptionsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">Opciones de la Extensión</h1>
      <PrefixEditor />
      <BehaviorEditor />
    </div>
  );
}

// The renderPage utility handles wrapping the component with common providers.
renderPage(OptionsPage)
