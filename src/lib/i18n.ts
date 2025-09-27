// A very simple i18n implementation.
// This can be easily replaced by a more robust library like i18next in the future.

const translations = {
  es: {
    // Errors
    'errors.duplicateCommand': 'El comando "{{command}}" ya está en uso. Por favor, elige otro.',
    'errors.unexpected': 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',

    // Popup
    'popup.title': '📑 Mis Macros',
    'popup.pending': '🔄 {{count}} pendientes',
    'popup.synced': '✅ Todo sincronizado',
    'popup.macrosOnThisSite': 'Macros en este sitio',
    'popup.newMacro': 'Nuevo macro',

    // Macro Form
    'macroForm.triggerLabel': 'Trigger',
    'macroForm.textLabel': 'Texto',
    'macroForm.sensitiveLabel': 'Marcar como sensible (se encripta)',
    'macroForm.updateButton': 'Actualizar',
    'macroForm.saveButton': 'Guardar',
    'macroForm.cancelButton': 'Cancelar',
  },
  // You could add more languages here in the future, e.g., en: { ... }
}

const currentLanguage = 'es' // This could be made dynamic later

/**
 * A simple translation function.
 * @param key The key for the translation string.
 * @param options An object with values to interpolate into the string.
 */
export function t(key: keyof typeof translations.es, options?: Record<string, string | number>): string {
  const keys = key.split('.')
  let text: any = translations[currentLanguage]
  for (const k of keys) {
    text = text?.[k]
  }

  if (typeof text !== 'string') return key

  if (options) {
    return Object.entries(options).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), text)
  }

  return text
}