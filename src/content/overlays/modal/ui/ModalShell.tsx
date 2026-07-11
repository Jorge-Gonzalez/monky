import React, { useRef } from 'react';
import { ModalShellProps } from '../types';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { useAppliedTheme } from '../../../../theme/hooks/useAppliedTheme';
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

  const theme = useMacroStore(state => state.config.theme); // for the nav logo variant

  useModalKeyboard(isVisible, onClose);
  useAppliedTheme(modalRef, isVisible);

  if (!isVisible) return null;

  // Clone children and inject modalContainerRef prop
  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, { containerRef: modalRef })
    : children;

  return (
    <div
      className="modal-backdrop position-fixed horizontal align-center justify-center"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="modal-dialog vertical ground rule corner-lg"
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

        <div className="modal-content elastic basis-ratio vertical">
          {childrenWithProps}
        </div>
      </div>
    </div>
  );
}
