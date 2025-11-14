import React, { useEffect, useCallback, useMemo } from 'react';

/**
 * Icon configuration types
 */
export type IconConfig =
  | string                                    // String: emoji, registered icon name, or raw SVG
  | { type: 'font'; class: string }           // Icon font class
  | (() => React.ReactNode);                  // Render function

/**
 * Button enable conditions
 */
export type EnableCondition = 'always' | 'single' | 'multiple' | 'any' | 'none' | ((count: number) => boolean);

/**
 * Button configuration
 */
export interface ToolbarButton<T = any> {
  /** Unique button identifier */
  id: string;

  /** Icon configuration */
  icon: IconConfig;

  /** Button label (tooltip/aria-label) */
  label: string;

  /** When this button is enabled */
  enabled: EnableCondition;

  /** Action to perform when clicked */
  action: (selectedItems: T[]) => void;

  /**
   * Optional keyboard shortcut
   * Supports modifiers: 'alt+n', 'ctrl+s', 'shift+delete', or plain keys: 'Delete', 'Enter'
   * Note: Avoid 'ctrl+n', 'ctrl+t', 'ctrl+w' as they conflict with browser shortcuts
   * Ctrl works with both Ctrl and Cmd (Mac) keys
   */
  shortcut?: string;

  /** Optional CSS class */
  className?: string;
}

/**
 * Toolbar position
 */
export type ToolbarPosition = 'header' | 'footer';

/**
 * Props for ActionToolbar component
 */
export interface ActionToolbarProps<T = any> {
  /** Toolbar buttons configuration */
  buttons: ToolbarButton<T>[];

  /** Position of toolbar */
  position?: ToolbarPosition;

  /** Number of selected items */
  selectionCount?: number;

  /** Currently selected items */
  selectedItems?: T[];

  /** CSS class name */
  className?: string;

  /** Enable global keyboard shortcuts */
  enableShortcuts?: boolean;

  /** Custom icon registry */
  iconRegistry?: Record<string, string>;

  // Events
  /** Called when any button is clicked */
  onAction?: (buttonId: string, selectedItems: T[]) => void;
}

/**
 * Default icon registry (emoji-based)
 */
const defaultIconRegistry: Record<string, string> = {
  'plus': '➕',
  'edit': '✏️',
  'trash': '🗑️',
  'save': '💾',
  'cancel': '✖️',
  'search': '🔍',
  'settings': '⚙️',
  'download': '⬇️',
  'upload': '⬆️',
  'copy': '📋',
  'delete': '🗑️'
};

/**
 * ActionToolbar - Generic button toolbar that reacts to selection state
 *
 * Features:
 * - Configurable buttons with icons
 * - Automatic enable/disable based on selection
 * - Keyboard shortcuts
 * - Flexible icon system (emoji, SVG, icon fonts)
 * - Position variants (header/footer)
 */
export function ActionToolbar<T = any>({
  buttons,
  position = 'footer',
  selectionCount = 0,
  selectedItems = [],
  className = '',
  enableShortcuts = true,
  iconRegistry = {},
  onAction
}: ActionToolbarProps<T>) {
  // Merge icon registries
  const mergedIconRegistry = useMemo(
    () => ({ ...defaultIconRegistry, ...iconRegistry }),
    [iconRegistry]
  );

  // Check if button is enabled
  const isButtonEnabled = useCallback((button: ToolbarButton<T>): boolean => {
    if (typeof button.enabled === 'function') {
      return button.enabled(selectionCount);
    }

    switch (button.enabled) {
      case 'always':
        return true;
      case 'single':
        return selectionCount === 1;
      case 'multiple':
        return selectionCount > 1;
      case 'any':
        return selectionCount >= 1;
      case 'none':
        return selectionCount === 0;
      default:
        return false;
    }
  }, [selectionCount]);

  // Handle button click
  const handleButtonClick = useCallback((button: ToolbarButton<T>) => {
    if (!isButtonEnabled(button)) return;

    button.action(selectedItems);

    if (onAction) {
      onAction(button.id, selectedItems);
    }
  }, [isButtonEnabled, selectedItems, onAction]);

  // Render icon
  const renderIcon = useCallback((iconConfig: IconConfig): React.ReactNode => {
    if (typeof iconConfig === 'string') {
      // Check if it's a registered icon
      if (mergedIconRegistry[iconConfig]) {
        return <span className="icon-text">{mergedIconRegistry[iconConfig]}</span>;
      }

      // Check if it's SVG
      if (iconConfig.startsWith('<svg')) {
        return <span dangerouslySetInnerHTML={{ __html: iconConfig }} />;
      }

      // Treat as emoji/text
      return <span className="icon-text">{iconConfig}</span>;
    }

    if (typeof iconConfig === 'object' && 'type' in iconConfig && iconConfig.type === 'font') {
      return <i className={iconConfig.class} />;
    }

    if (typeof iconConfig === 'function') {
      return iconConfig();
    }

    return null;
  }, [mergedIconRegistry]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!enableShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const button of buttons) {
        if (!button.shortcut) continue;
        if (!isButtonEnabled(button)) continue;

        const shortcut = button.shortcut.toLowerCase();
        const key = event.key.toLowerCase();

        // Parse shortcut for modifiers (e.g., "ctrl+n", "alt+delete", or just "n")
        const parts = shortcut.split('+').map(p => p.trim());
        let requiresCtrl = false;
        let requiresAlt = false;
        let requiresShift = false;
        let targetKey = shortcut;

        if (parts.length > 1) {
          // Has modifiers
          targetKey = parts[parts.length - 1];
          const modifiers = parts.slice(0, -1);

          requiresCtrl = modifiers.includes('ctrl') || modifiers.includes('control');
          requiresAlt = modifiers.includes('alt');
          requiresShift = modifiers.includes('shift');
        }

        // Check if modifiers match
        const ctrlMatch = requiresCtrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = requiresAlt ? event.altKey : !event.altKey;
        const shiftMatch = requiresShift ? event.shiftKey : !event.shiftKey;

        // Match key and modifiers
        if (key === targetKey && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          handleButtonClick(button);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buttons, enableShortcuts, isButtonEnabled, handleButtonClick]);

  return (
    <div
      className={`action-toolbar ${position} ${className}`}
      role="toolbar"
      aria-label="Actions"
    >
      {buttons.map((button) => {
        const enabled = isButtonEnabled(button);
        const shortcutHint = button.shortcut ? ` (${button.shortcut})` : '';

        return (
          <button
            key={button.id}
            type="button"
            className={`toolbar-button ${button.className || ''} ${enabled ? 'enabled' : 'disabled'}`}
            disabled={!enabled}
            onClick={() => handleButtonClick(button)}
            aria-label={`${button.label}${shortcutHint}`}
            aria-disabled={!enabled}
            title={`${button.label}${shortcutHint}`}
          >
            {renderIcon(button.icon)}
            <span className="button-label">{button.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Utility function to register custom icons globally
 */
let globalIconRegistry: Record<string, string> = { ...defaultIconRegistry };

export function registerIcon(name: string, icon: string) {
  globalIconRegistry[name] = icon;
}

export function registerIcons(icons: Record<string, string>) {
  globalIconRegistry = { ...globalIconRegistry, ...icons };
}

export function getGlobalIconRegistry(): Record<string, string> {
  return { ...globalIconRegistry };
}
