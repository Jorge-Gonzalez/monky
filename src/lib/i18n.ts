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
      pageTitle: 'Macro Editor',
      title: {
        new: 'New Macro',
        edit: 'Edit: {{command}}',
        newShort: 'New',
        editShort: 'Edit',
      },
      openFullEditor: 'Open in full editor',
      commandSuggestionsLabel: 'Existing macros',
      deleteMacro: 'Delete macro',
      confirmDelete: 'Confirm delete',
      cancelDelete: 'Cancel',
    },
    macroPanel: {
      label: 'Your macros',
      toolbarLabel: 'Macro list actions',
      empty: 'No macros yet. Create one on the left.',
      selectedCount: '{{count}} selected',
      clearSelection: 'Clear',
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: 'Delete {{count}}',
      cancelDelete: 'Cancel',
    },

    // Settings
    settings: {
      title: 'Settings',
      language: 'Language',
      colorTheme: 'Color theme',
      lightMode: 'Light mode',
      darkMode: 'Dark mode',
      sections: {
        general: 'General',
        appearance: 'Appearance',
        data: 'Data',
      },
      snapshots: {
        title: 'Automatic backups',
        description: 'Your macros are backed up here as you change them.',
        empty: 'No backups yet. One is kept each time your macros change.',
        today: 'Earlier today, {{time}}',
        yesterday: 'Yesterday, {{time}}',
        earlier: '{{date}}, {{time}}',
        count: '{{count}} macros',
        restore: 'Restore',
        confirm: 'Replace my macros',
        cancel: 'Cancel',
        status: {
          restored: 'Restored {{count}} macros. The previous set was backed up first.',
          unreadable: 'That backup could not be read, so nothing was changed.',
        },
      },
      cloudBackup: {
        title: 'Browser account backup',
        empty: 'Not backed up yet. This happens on its own after you change a macro.',
        lastBackup: 'Backed up {{when}}',
        count: '{{count}} macros',
        fromAnotherDevice: 'Last changed on another device.',
        restore: 'Restore',
        confirm: 'Replace my macros',
        cancel: 'Cancel',
        quota: '{{used}} KB of {{total}} KB used',
        quotaLabel: 'Browser account storage used',
        backUpNow: 'Back up now',
        status: {
          restored: 'Restored {{count}} macros. The previous set was backed up first.',
          backedUp: 'Backed up {{count}} macros to your browser account.',
          upToDate: 'Already up to date.',
          tooLarge: 'Your macros no longer fit your browser account. Export them instead.',
          failed: 'The backup could not be written: {{error}}',
          none: 'There is no backup in your browser account yet.',
          incomplete: 'The backup has only partly arrived on this device. Try again in a moment.',
          corrupt: 'That backup did not add up, so nothing was changed.',
        },
      },
      importExport: {
        title: 'Import / Export',
        description:
          'Export your macros as JSON to back them up or move them to another device. Importing merges macros — duplicates (same command) are skipped.',
        exportButton: 'Export',
        importButton: 'Import',
        nudge: '{{count}} changes since your last export, {{when}}.',
        nudgeTruncated: 'More than {{count}} changes since your last export, {{when}}.',
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
      editMacro: 'Edit macro',
      confirmDelete: 'Delete this macro? Press ↵ to confirm',
      macroResultsLabel: 'Macro results',
      commandResultsLabel: 'Command results',
      footer: {
        macro: '{{count}} macro',
        macros: '{{count}} macros',
        command: '{{count}} command',
        commands: '{{count}} commands',
        commandsLabel: 'commands',
        navigate: 'navigate',
        run: 'run',
        select: 'select',
        edit: 'edit',
        close: 'close',
        showShortcuts: 'Show keyboard shortcuts',
        hideShortcuts: 'Hide keyboard shortcuts',
      },
    },

    macroSuggestions: {
      listLabel: 'Matching macros',
      activeOption: '{{command}}, {{text}}, {{index}} of {{total}}',
      footer: {
        navigate: 'Navigate',
        select: 'Select',
        cancel: 'Cancel',
      },
    },

    deleteConfirm: {
      optionsLabel: 'Confirm deletion',
      message: 'Delete macro',
      cancel: 'Cancel',
      delete: 'Delete',
      footer: {
        switch: 'switch',
        select: 'select',
        cancel: 'cancel',
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
      noMacros: 'No macros found.',
    },

    // Macro Form
    macroForm: {
      triggerLabel: 'Shortcut',
      textLabel: 'Text',
      sensitiveLabel: 'Mark as sensitive (encrypted)',
      updateButton: 'Update',
      saveButton: 'Save',
      cancelButton: 'Cancel',
      savedToast: 'Macro saved',
      updatedToast: 'Macro updated',
      commandPrefixError: 'Command must start with: {{prefixes}}',
      contentPlaceholder: 'Enter your macro content...',
      commandPlaceholder: 'Enter your command e.g., {{prefix}}sig',
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
      autoShort: 'Automatic',
      manual: 'Manual (with Space, Enter, or Tab)',
      manualShort: 'Manual',
      description:
        'In automatic mode, text replaces on match, but if a longer macro starts the same way it waits briefly before replacing.',
    },

    contentEditor: {
      textStyle: 'Text style',
      paragraph: 'Paragraph',
      h1: 'Heading 1',
      h2: 'Heading 2',
      h3: 'Heading 3',
      blockquote: 'Blockquote',
      pre: 'Code block',
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
      pageTitle: 'Editor de Macros',
      title: {
        new: 'Nuevo macro',
        edit: 'Editar: {{command}}',
        newShort: 'Nuevo',
        editShort: 'Editar',
      },
      openFullEditor: 'Abrir en editor completo',
      commandSuggestionsLabel: 'Macros existentes',
      deleteMacro: 'Borrar macro',
      confirmDelete: 'Confirmar borrado',
      cancelDelete: 'Cancelar',
    },

    macroPanel: {
      label: 'Tus macros',
      toolbarLabel: 'Acciones de la lista de macros',
      empty: 'Aún no hay macros. Crea uno a la izquierda.',
      selectedCount: '{{count}} seleccionados',
      clearSelection: 'Limpiar',
      edit: 'Editar',
      delete: 'Eliminar',
      confirmDelete: 'Eliminar {{count}}',
      cancelDelete: 'Cancelar',
    },

    // Settings
    settings: {
      title: 'Configuración',
      language: 'Idioma',
      colorTheme: 'Tema de color',
      lightMode: 'Modo claro',
      darkMode: 'Modo oscuro',
      sections: {
        general: 'General',
        appearance: 'Apariencia',
        data: 'Datos',
      },
      snapshots: {
        title: 'Copias automáticas',
        description: 'Tus macros se copian aquí cada vez que los cambias.',
        empty: 'Aún no hay copias. Se guarda una cada vez que cambian tus macros.',
        today: 'Hoy, {{time}}',
        yesterday: 'Ayer, {{time}}',
        earlier: '{{date}}, {{time}}',
        count: '{{count}} macros',
        restore: 'Restaurar',
        confirm: 'Reemplazar mis macros',
        cancel: 'Cancelar',
        status: {
          restored: 'Se restauraron {{count}} macros. El conjunto anterior se copió antes.',
          unreadable: 'No se pudo leer esa copia, así que no se cambió nada.',
        },
      },
      cloudBackup: {
        title: 'Copia en la cuenta del navegador',
        empty: 'Aún no hay copia. Se hace sola después de que cambies un macro.',
        lastBackup: 'Copiado el {{when}}',
        count: '{{count}} macros',
        fromAnotherDevice: 'Modificado por última vez en otro dispositivo.',
        restore: 'Restaurar',
        confirm: 'Reemplazar mis macros',
        cancel: 'Cancelar',
        quota: '{{used}} KB de {{total}} KB usados',
        quotaLabel: 'Almacenamiento usado en la cuenta del navegador',
        backUpNow: 'Copiar ahora',
        status: {
          restored: 'Se restauraron {{count}} macros. El conjunto anterior se copió antes.',
          backedUp: 'Se copiaron {{count}} macros a tu cuenta del navegador.',
          upToDate: 'Ya está al día.',
          tooLarge: 'Tus macros ya no caben en tu cuenta del navegador. Expórtalas en su lugar.',
          failed: 'No se pudo escribir la copia: {{error}}',
          none: 'Todavía no hay ninguna copia en tu cuenta del navegador.',
          incomplete: 'La copia solo llegó en parte a este dispositivo. Inténtalo en un momento.',
          corrupt: 'Esa copia no cuadró, así que no se cambió nada.',
        },
      },
      importExport: {
        title: 'Importar / Exportar',
        description:
          'Exporta tus macros como JSON para respaldarlas o moverlas a otro dispositivo. La importación combina macros: los duplicados (mismo comando) se omiten.',
        exportButton: 'Exportar',
        importButton: 'Importar',
        nudge: '{{count}} cambios desde tu última exportación, el {{when}}.',
        nudgeTruncated: 'Más de {{count}} cambios desde tu última exportación, el {{when}}.',
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
      editMacro: 'Editar macro',
      confirmDelete: '¿Borrar esta macro? Pulsa ↵ para confirmar',
      macroResultsLabel: 'Resultados de macros',
      commandResultsLabel: 'Resultados de comandos',
      footer: {
        macro: '{{count}} macro',
        macros: '{{count}} macros',
        command: '{{count}} comando',
        commands: '{{count}} comandos',
        commandsLabel: 'comandos',
        navigate: 'navegar',
        run: 'ejecutar',
        select: 'seleccionar',
        edit: 'editar',
        close: 'cerrar',
        showShortcuts: 'Mostrar atajos de teclado',
        hideShortcuts: 'Ocultar atajos de teclado',
      },
    },

    macroSuggestions: {
      listLabel: 'Macros coincidentes',
      activeOption: '{{command}}, {{text}}, {{index}} de {{total}}',
      footer: {
        navigate: 'Navegar',
        select: 'Seleccionar',
        cancel: 'Cancelar',
      },
    },

    deleteConfirm: {
      optionsLabel: 'Confirmar borrado',
      message: 'Borrar macro',
      cancel: 'Cancelar',
      delete: 'Borrar',
      footer: {
        switch: 'cambiar',
        select: 'seleccionar',
        cancel: 'cancelar',
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
      noMacros: 'No hay macros creados.',
    },

    // Macro Form
    macroForm: {
      triggerLabel: 'Atajo',
      textLabel: 'Texto',
      sensitiveLabel: 'Marcar como sensible (se encripta)',
      updateButton: 'Actualizar',
      saveButton: 'Guardar',
      cancelButton: 'Cancelar',
      savedToast: 'Macro guardada',
      updatedToast: 'Macro actualizada',
      commandPrefixError: 'El comando debe empezar con: {{prefixes}}',
      contentPlaceholder: 'Escribe el contenido de tu macro...',
      commandPlaceholder: 'Escribe tu comando ej. {{prefix}}firma',
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
      autoShort: 'Automático',
      manual: 'Manual (con Espacio, Enter, o Tab)',
      manualShort: 'Manual',
      description:
        'En modo automático, el texto se reemplaza al coincidir, pero si existe un macro más largo que empieza igual, espera un instante antes de reemplazar.',
    },

    contentEditor: {
      textStyle: 'Estilo de texto',
      paragraph: 'Párrafo',
      h1: 'Encabezado 1',
      h2: 'Encabezado 2',
      h3: 'Encabezado 3',
      blockquote: 'Cita',
      pre: 'Código',
    },
  },
  // You could add more languages here in the future, e.g., en: { ... }
}

type Language = keyof typeof translations

// Helper type to flatten the nested translation object keys
type FlattenKeys<T, P extends string = ''> = {
  [K in keyof T]: T[K] extends string ? `${P}${K & string}` : FlattenKeys<T[K], `${P}${K & string}.`>
}[keyof T]

// Use the helper to generate all possible dot-notation keys
type TranslationKeys = FlattenKeys<(typeof translations)['en']>

// The old type definition, kept for reference:
// type TranslationKeys = keyof typeof translations['en']; // 'en' is the source of truth for keys

export function t(key: TranslationKeys, options?: Record<string, string | number>): string {
  const lang = (useMacroStore.getState()?.config?.language ?? 'en') as Language
  const locale = translations[lang] ?? translations.en

  let text: unknown = locale
  for (const k of key.split('.')) {
    text = (text as Record<string, unknown>)?.[k]
  }

  if (typeof text !== 'string') return key

  if (options) {
    return Object.entries(options).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), text)
  }

  return text
}
