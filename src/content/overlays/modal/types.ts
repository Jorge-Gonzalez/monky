/**
 * Modal view types
 */
export type ModalView = 'search' | 'settings' | 'editor';

/**
 * Props for modal shell component
 */
export interface ModalShellProps {
  isVisible: boolean;
  onClose: () => void;
  currentView: ModalView;
  onViewChange: (view: ModalView) => void;
  children: React.ReactNode;
}

/**
 * Props for modal navigation component
 */
export interface ModalNavigationProps {
  currentView: ModalView;
  onViewChange: (view: ModalView) => void;
}

/**
 * Base props for all modal view components
 */
export interface BaseModalViewProps {
  onClose: () => void;
  onViewChange: (view: ModalView) => void;
}
