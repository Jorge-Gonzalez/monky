import type { Macro } from '../../../types';

export type ModalView = 'search' | 'settings' | 'editor';

export interface ModalShellProps {
  isVisible: boolean;
  onClose: () => void;
  currentView: ModalView;
  onViewChange: (view: ModalView) => void;
  children: React.ReactNode;
}

export interface ModalNavigationProps {
  currentView: ModalView;
  onViewChange: (view: ModalView) => void;
}

export interface BaseModalViewProps {
  onClose: () => void;
  onViewChange: (view: ModalView) => void;
  onNavigateToEditor: (macro?: Macro) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export interface MacroEditorViewProps extends BaseModalViewProps {
  initialMacro?: Macro;
}
