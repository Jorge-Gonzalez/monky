import React, { useRef } from 'react';
import { ModalShellProps } from '../types';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { useThemeColors } from '../../../../theme/hooks/useThemeColors';
import { useMacroStore } from '../../../../store/useMacroStore';
import { ModalNavigation } from './ModalNavigation';

/**
 * ModalShell - The container for all modal views
 *
 * Provides:
 * - Backdrop with click-to-close
 * - Centered modal dialog
 * - Theme integration
 * - Global keyboard handling (Escape)
 * - View navigation
 */
export function ModalShell({
  isVisible,
  onClose,
  currentView,
  onViewChange,
  children
}: ModalShellProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const theme = useMacroStore(state => state.config.theme);
  const colorTheme = useMacroStore(state => state.config.colorTheme ?? 'humo');

  useModalKeyboard(isVisible, onClose);
  useThemeColors(modalRef, theme, isVisible, colorTheme);

  if (!isVisible) return null;

  // Clone children and inject modalContainerRef prop
  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, { containerRef: modalRef })
    : children;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Monky Modal"
        onMouseDown={e => e.stopPropagation()}
      >
        <ModalNavigation
          currentView={currentView}
          onViewChange={onViewChange}
          theme={theme}
        />

        <div className="modal-content">
          {childrenWithProps}
        </div>
      </div>
    </div>
  );
}
