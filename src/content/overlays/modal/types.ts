import type { ReactNode, RefObject } from 'react';
import type { Macro, ThemeMode } from '../../../types';

export type ModalView = 'search' | 'settings' | 'editor';

export interface ModalShellProps {
  isVisible: boolean;
  onClose: () => void;
  currentView: ModalView;
  onViewChange: (view: ModalView) => void;
  children: ReactNode;
}

export interface ModalNavigationProps {
  currentView: ModalView;
  onViewChange: (view: ModalView) => void;
  theme: ThemeMode;
}

export interface BaseModalViewProps {
  onClose: () => void;
  onViewChange: (view: ModalView) => void;
  onNavigateToEditor: (macro?: Macro) => void;
  containerRef?: RefObject<HTMLDivElement>;
}

export interface MacroEditorViewProps extends BaseModalViewProps {
  initialMacro?: Macro;
}
