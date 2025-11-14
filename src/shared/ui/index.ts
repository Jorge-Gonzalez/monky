/**
 * Infrastructure UI Components
 *
 * Generic, reusable React components for building interactive UIs
 */

export { MultiSelectList } from './MultiSelectList';
export type {
  MultiSelectListProps,
  SelectionConfig
} from './MultiSelectList';

export { FuzzySearchField, useFuzzySearchFocus } from './FuzzySearchField';
export type {
  FuzzySearchFieldProps,
  SearchAlgorithm,
  DataSource
} from './FuzzySearchField';

export {
  ActionToolbar,
  registerIcon,
  registerIcons,
  getGlobalIconRegistry
} from './ActionToolbar';
export type {
  ActionToolbarProps,
  ToolbarButton,
  IconConfig,
  EnableCondition,
  ToolbarPosition
} from './ActionToolbar';

export { SearchableListView } from './SearchableListView';
export type {
  SearchableListViewProps,
  SearchableListConfig
} from './SearchableListView';

export { useSearchListCoordination } from './useSearchListCoordination';
export type {
  CoordinationState,
  CoordinationConfig,
  CoordinationAPI,
  NavigationMode
} from './useSearchListCoordination';

export { RichTextEditor } from './RichTextEditor';
export type {
  RichTextEditorProps,
  RichTextEditorRef,
  EditorToolbarButton
} from './RichTextEditor';

export { CommandInput } from './CommandInput';
export type {
  CommandInputProps,
  ValidationResult
} from './CommandInput';

export { ToggleField } from './ToggleField';
export type {
  ToggleFieldProps
} from './ToggleField';

export { MacroEditorView } from './MacroEditorView';
export type {
  MacroEditorViewProps,
  MacroEditorConfig
} from './MacroEditorView';

export { useMacroEditorCoordination } from './useMacroEditorCoordination';
export type {
  EditorCoordinationState,
  EditorCoordinationConfig,
  EditorCoordinationAPI,
  EditorMode,
  MacroData,
  ValidationErrors
} from './useMacroEditorCoordination';
