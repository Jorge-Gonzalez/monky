// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MacroSearchResults } from './MacroSearchResults';

vi.mock('../../../../../lib/i18n', () => ({ t: (key: string) => key }));
vi.mock('../../../../macroEngine/replacement/placeholders', () => ({
  hasPlaceholders: vi.fn(() => false),
}));

const macros = [
  { id: 1, command: '/sig',  text: 'My signature' },
  { id: 2, command: '/addr', text: 'My address'   },
  { id: 3, command: '/br',   text: 'Be right back' },
];

const baseProps = {
  macros,
  selectedIndex: -1,
  searchQuery: '',
  onSelect: vi.fn(),
  resultsRef: { current: null } as any,
};

describe('MacroSearchResults', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('rendering', () => {
    it('renders a row for each macro', () => {
      render(<MacroSearchResults {...baseProps} />);
      expect(screen.getByText('/sig')).toBeInTheDocument();
      expect(screen.getByText('/addr')).toBeInTheDocument();
      expect(screen.getByText('/br')).toBeInTheDocument();
    });

    it('marks the selected row with the selected class', () => {
      const { container } = render(<MacroSearchResults {...baseProps} selectedIndex={1} />);
      const items = container.querySelectorAll('.macro-search-item');
      expect(items[1]).toHaveClass('selected');
      expect(items[0]).not.toHaveClass('selected');
    });

    it('shows empty state when macros list is empty', () => {
      render(<MacroSearchResults {...baseProps} macros={[]} searchQuery="xyz" />);
      expect(screen.getByText('modalSearch.noMacrosFound')).toBeInTheDocument();
    });
  });

  describe('edit button', () => {
    it('does not render edit buttons when onEdit is not provided', () => {
      const { container } = render(<MacroSearchResults {...baseProps} />);
      expect(container.querySelectorAll('.macro-search-item-edit')).toHaveLength(0);
    });

    it('renders an edit button on each row when onEdit is provided', () => {
      const { container } = render(<MacroSearchResults {...baseProps} onEdit={vi.fn()} />);
      expect(container.querySelectorAll('.macro-search-item-edit')).toHaveLength(macros.length);
    });

    it('calls onEdit with the correct macro when the edit button is clicked', () => {
      const onEdit = vi.fn();
      const { container } = render(<MacroSearchResults {...baseProps} onEdit={onEdit} />);
      const editButtons = container.querySelectorAll('.macro-search-item-edit');
      fireEvent.click(editButtons[1]);
      expect(onEdit).toHaveBeenCalledWith(macros[1]);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('does not call onSelect when the edit button is clicked', () => {
      const onSelect = vi.fn();
      const onEdit = vi.fn();
      const { container } = render(<MacroSearchResults {...baseProps} onSelect={onSelect} onEdit={onEdit} />);
      fireEvent.click(container.querySelectorAll('.macro-search-item-edit')[0]);
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('row selection', () => {
    it('calls onSelect with the correct macro when a row is clicked', () => {
      const onSelect = vi.fn();
      render(<MacroSearchResults {...baseProps} onSelect={onSelect} />);
      fireEvent.click(screen.getByText('/addr'));
      expect(onSelect).toHaveBeenCalledWith(macros[1]);
    });
  });
});
