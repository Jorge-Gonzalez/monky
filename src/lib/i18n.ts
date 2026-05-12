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

    // Editor
    editor: {
      title: 'Macro Editor',
    },
    macroListEditor: {
      noMacros: 'No macros found.'
    },

    macroItemEditor: {
      edit: '✏️ Edit',
      delete: '🗑 Delete',
    },

    // Settings
    settings: {
      title: 'Settings',
      language: 'Language',
    },

    // Popup
    popup: {
      title: '📑 My Macros',
      pending: '🔄 {{count}} pending',
      synced: '✅ Synced',
      macrosOnThisSite: 'Macros on this site',
      localFile: 'Local file',
      searchPlaceholder: 'Search macros...',
      newMacro: 'New macro',
    },

    macroItem: {
      edit: '✏️ Edit',
      delete: '🗑 Delete',
    },

    macroList: {
      noMacros: 'No macros found.'
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

    options: {
      title: 'Extension Options',
      description: 'Configure your macro extension preferences.',
      prefixEditor: {
        title: 'Macro Prefixes',
        description: 'Select the characters that can start a macro trigger (e.g., /brb).',
      },
    },

    replacementMode: {
      title: 'Replacement Mode',
      auto: 'Automatic (on match)',
      manual: 'Manual (with Space, Enter, or Tab)'
    },
  },
  es: {
    // Errors
    errors: {
      duplicateCommand: 'El comando "{{command}}" ya está en uso. Por favor, elige otro.',
      unexpected: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    },

    // Editor
    editor: {
      title: 'Editor de Macros',
    },

    macroListEditor: {
      noMacros: 'No hay macros creados.'
    },

    macroItemEditor: {
      edit: '✏️ Editar',
      delete: '🗑 Eliminar',
    },

    // Settings
    settings: {
      title: 'Configuración',
      language: 'Idioma',
    },


    // Popup
    popup: {
      title: '📑 Mis Macros',
      pending: '🔄 {{count}} pendientes',
      synced: '✅ Todo sincronizado',
      macrosOnThisSite: 'Macros en este sitio',
      localFile: 'Archivo local',
      searchPlaceholder: 'Search macros...',
      newMacro: 'Nuevo macro',
    },

    macroItem: {
      edit: '✏️ Editar',
      delete: '🗑 Eliminar',
    },

    macroList: {
      noMacros: 'No hay macros creados.'
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

    options: {
      title: 'Opciones de la Extensión',
      description: 'Configura las preferencias de tu extensión de macros.',
      prefixEditor: {
        title: 'Prefijos de Macro',
        description: 'Selecciona los caracteres que pueden iniciar un trigger de macro (ej. /brb).',
      },
    },

    replacementMode: {
      title: 'Modo de Sustitución',
      auto: 'Automático (al coincidir)',
      manual: 'Manual (con Espacio, Enter, o Tab)'
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

export function t(key: TranslationKeys, options?: Record<string, string | number>): string {
  const lang = (useMacroStore.getState()?.config?.language ?? 'en') as Language;
  const locale = translations[lang] ?? translations.en;

  let text: unknown = locale;
  for (const k of key.split('.')) {
    text = (text as Record<string, unknown>)?.[k];
  }

  if (typeof text !== 'string') return key;

  if (options) {
    return Object.entries(options).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), text);
  }

  return text;
}