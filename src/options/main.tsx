import React from 'react'
import { PrefixEditor } from './ui/PrefixEditor'
import { ReplacementMode } from './ui/ReplacementMode'
import { renderPage } from '../lib/renderPage'
import { t } from '../lib/i18n'

function OptionsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">{t('options.title')}</h1>
      <PrefixEditor />
      <ReplacementMode />
    </div>
  );
}

// The renderPage utility handles wrapping the component with common providers.
renderPage(OptionsPage)
