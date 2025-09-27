// A very simple i18n implementation.
// This can be easily replaced by a more robust library like i18next in the future.
import { useMacroStore } from '../store/useMacroStore'

const translations = {
  en: {
    // Errors
    errors: {
      duplicateCommand: 'The command "{{command}}" already exists. Please choose another.',
      unexpected: 'An unexpected error occurred. Please try again.',
    },

    // Popup
    popup: {
      title: '📑 My Macros',
      pending: '🔄 {{count}} pending',
      synced: '✅ Synced',
      macrosOnThisSite: 'Macros on this site',
      localFile: 'Local file',
      newMacro: 'New macro',
    },

    // Macro Form
    macroForm: {
      triggerLabel: 'Trigger',
      textLabel: 'Text',
      sensitiveLabel: 'Mark as sensitive (encrypted)',
      updateButton: 'Update',
      saveButton: 'Save',
      cancelButton: 'Cancel',
    },
  },
  es: {
    // Errors
    errors: {
      duplicateCommand: 'El comando "{{command}}" ya está en uso. Por favor, elige otro.',
      unexpected: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    },

    // Popup
    popup: {
      title: '📑 Mis Macros',
      pending: '🔄 {{count}} pendientes',
      synced: '✅ Todo sincronizado',
      macrosOnThisSite: 'Macros en este sitio',
      localFile: 'Archivo local',
      newMacro: 'Nuevo macro',
    },

    // Macro Form
    macroForm: {
      triggerLabel: 'Trigger',
      textLabel: 'Texto',
      sensitiveLabel: 'Marcar como sensible (se encripta)',
      updateButton: 'Actualizar',
      saveButton: 'Guardar',
      cancelButton: 'Cancelar',
    },
  },
  // You could add more languages here in the future, e.g., en: { ... }
}

type Language = keyof typeof translations;

// Helper type to flatten the nested translation object keys
type FlattenKeys<T, P extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? `${P}${K & string}`
    : FlattenKeys<T[K], `${P}${K & string}.`>
}[keyof T];

// Use the helper to generate all possible dot-notation keys
type TranslationKeys = FlattenKeys<typeof translations['en']>;

// The old type definition, kept for reference:
// type TranslationKeys = keyof typeof translations['en']; // 'en' is the source of truth for keys

let currentLanguage: Language = useMacroStore.getState()?.config?.language ?? 'es'

// Subscribe to the store to automatically update the language
useMacroStore.subscribe(state => {
  const newLang = state.config.language
  if (newLang && newLang !== currentLanguage) {
    setLanguage(newLang)
  }
})

/**
 * Sets the application's current language.
 * @param lang The language to set.
 */
function setLanguage(lang: Language) {
  if (translations[lang]) {
    currentLanguage = lang;
  }
}

/**
 * A simple translation function.
 * @param key The key for the translation string.
 * @param options An object with values to interpolate into the string.
 */
export function t(key: TranslationKeys, options?: Record<string, string | number>): string {
  const keys = key.split('.')
  let text: any = translations[currentLanguage] ?? translations.en; // Fallback to English
  for (const k of keys) {
    text = text?.[k]
  }

  if (typeof text !== 'string') return key

  if (options) {
    return Object.entries(options).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), text)
  }

  return text
}