import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useScrollIntoView } from '../hooks/useScrollIntoView';

/** The panel the search input points at with aria-controls. */
export const SEARCH_LISTBOX_ID = 'monky-search-results';

/** Options are addressed by position, so the input can name the active one from its index alone. */
export const searchOptionId = (index: number) => `${SEARCH_LISTBOX_ID}-option-${index}`;

const SELECTED_OPTION = '[role="option"][aria-selected="true"]';

interface SearchResultsPanelProps {
  children: ReactNode;
  /** Only when the panel actually holds options — a panel of hints is not a listbox. */
  role?: 'listbox';
  label?: string;
  /** Kept in view as the selection moves; absent when the panel holds no options. */
  activeIndex?: number;
}

/** The scrolling result surface every search mode renders into. */
export function SearchResultsPanel({ children, role, label, activeIndex = -1 }: SearchResultsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollIntoView(panelRef, activeIndex, SELECTED_OPTION);

  return (
    <div
      ref={panelRef}
      id={SEARCH_LISTBOX_ID}
      data-component="search-results"
      aria-label={label}
      className="grid-fit-sm elastic basis-ratio padding-right-lg padding-left-xl margin-right-xs content-align-start scroll-auto max-height-results-md
        ground"
      role={role}
    >
      {children}
    </div>
  );
}
