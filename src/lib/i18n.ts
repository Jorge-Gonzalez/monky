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
      importExport: {
        title: 'Import / Export',
        description: 'Export your macros as JSON to back them up or move them to another device. Importing merges macros — duplicates (same command) are skipped.',
        exportButton: 'Export',
        importButton: 'Import',
        status: {
          added: '{{count}} added',
          addedWithSkipped: '{{added}} added, {{skipped}} skipped (duplicate command)',
          invalidFile: 'Invalid file — expected a JSON array',
          noValidMacros: 'No valid macros found in file',
        },
      },
    },

    modalNavigation: {
      switchTo: 'Switch to {{view}}',
      search: 'Search',
      editor: 'Editor',
      settings: 'Settings',
    },

    modalSearch: {
      inputPlaceholder: 'Search macros...',
      awaitingHint: 'Type / or ; followed by a command name',
      noMatchingCommands: 'No matching commands',
      noMacrosFound: 'No macros found',
      startTypingHint: 'Start typing to search macros...',
      footer: {
        macro: '{{count}} macro',
        macros: '{{count}} macros',
        command: '{{count}} command',
        commands: '{{count}} commands',
        commandsLabel: 'commands',
        navigate: 'navigate',
        run: 'run',
        select: 'select',
        close: 'close',
      },
    },

    macroSuggestions: {
      footer: {
        navigate: 'Navigate',
        select: 'Select',
        cancel: 'Cancel',
      },
    },

    macroEditor: {
      title: {
        new: 'New Macro',
        edit: 'Edit: {{command}}',
      },
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
      triggerLabel: 'Shortcut',
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
      manual: 'Manual (with Space, Enter, or Tab)',
      description: 'In automatic mode, text replaces on match, but if a longer macro starts the same way it waits briefly before replacing.',
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
      importExport: {
        title: 'Importar / Exportar',
        description: 'Exporta tus macros como JSON para respaldarlas o moverlas a otro dispositivo. La importación combina macros: los duplicados (mismo comando) se omiten.',
        exportButton: 'Exportar',
        importButton: 'Importar',
        status: {
          added: '{{count}} agregados',
          addedWithSkipped: '{{added}} agregados, {{skipped}} omitidos (comando duplicado)',
          invalidFile: 'Archivo inválido — se esperaba un array JSON',
          noValidMacros: 'No se encontraron macros válidas en el archivo',
        },
      },
    },

    modalNavigation: {
      switchTo: 'Ir a {{view}}',
      search: 'Buscar',
      editor: 'Editor',
      settings: 'Configuración',
    },

    modalSearch: {
      inputPlaceholder: 'Buscar macros...',
      awaitingHint: 'Escribe / o ; seguido de un nombre de comando',
      noMatchingCommands: 'No hay comandos coincidentes',
      noMacrosFound: 'No se encontraron macros',
      startTypingHint: 'Empieza a escribir para buscar macros...',
      footer: {
        macro: '{{count}} macro',
        macros: '{{count}} macros',
        command: '{{count}} comando',
        commands: '{{count}} comandos',
        commandsLabel: 'comandos',
        navigate: 'navegar',
        run: 'ejecutar',
        select: 'seleccionar',
        close: 'cerrar',
      },
    },

    macroSuggestions: {
      footer: {
        navigate: 'Navegar',
        select: 'Seleccionar',
        cancel: 'Cancelar',
      },
    },

    macroEditor: {
      title: {
        new: 'Nuevo macro',
        edit: 'Editar: {{command}}',
      },
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
      triggerLabel: 'Atajo',
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
      manual: 'Manual (con Espacio, Enter, o Tab)',
      description: 'En modo automático, el texto se reemplaza al coincidir, pero si existe un macro más largo que empieza igual, espera un instante antes de reemplazar.',
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