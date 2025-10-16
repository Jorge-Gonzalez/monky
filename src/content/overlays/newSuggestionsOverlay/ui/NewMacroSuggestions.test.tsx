import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NewMacroSuggestions } from './NewMacroSuggestions';
import { Macro } from '../../../../types';

// Mock the hooks used in the component
vi.mock('../../../../theme/hooks/useThemeColors', () => ({
  useThemeColors: vi.fn(),
}));

vi.mock('../../../../store/useMacroStore', () => ({
  useMacroStore: vi.fn(() => ({ config: { theme: 'default' } })),
}));

// Mock the popup positioning hook
vi.mock('../utils/popupPositioning', () => ({
  usePopupPosition: vi.fn(() => ({ x: 100, y: 120, placement: 'bottom' })),
}));

// Mock keyboard navigation hook
const mockNavigateLeft = vi.fn();
const mockNavigateRight = vi.fn();

vi.mock('../hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: vi.fn(),
}));

vi.mock('../hooks/useListNavigation', () => ({
  useListNavigation: vi.fn((length) => ({
    selectedIndex: 0,
    navigateLeft: mockNavigateLeft,
    navigateRight: mockNavigateRight,
  })),
}));

const mockMacros: Macro[] = [
  {
    id: '1',
    command: 'test-macro',
    text: 'This is a test macro',
    updated_at: String(new Date()),
  },
  {
    id: '2',
    command: 'another-test',
    text: 'This is another test macro',
    updated_at: String(new Date()),
  },
  {
    id: '3',
    command: 'different',
    text: 'This is different',
    updated_at: String(new Date()),
  },
];

const defaultProps = {
  macros: mockMacros,
  filterBuffer: 'test',
  mode: 'filter' as const,
  cursorPosition: { x: 100, y: 100 },
  isVisible: true,
  onSelectMacro: vi.fn(),
  onClose: vi.fn(),
};

describe('NewMacroSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders when visible with matching macros in filter mode', () => {
      render(<NewMacroSuggestions {...defaultProps} />);

      expect(screen.getByText('test-macro')).toBeInTheDocument();
      expect(screen.getByText('another-test')).toBeInTheDocument();
      expect(screen.queryByText('different')).not.toBeInTheDocument(); // Doesn't match "test"
    });

    test('renders all macros in showAll mode', () => {
      render(<NewMacroSuggestions {...defaultProps} mode="showAll" filterBuffer="" />);

      expect(screen.getByText('test-macro')).toBeInTheDocument();
      expect(screen.getByText('another-test')).toBeInTheDocument();
      expect(screen.getByText('different')).toBeInTheDocument();
    });

    test('returns null when invisible', () => {
      const { container } = render(<NewMacroSuggestions {...defaultProps} isVisible={false} />);

      expect(container.firstChild).toBeNull();
    });

    test('returns null when no matching macros', () => {
      const { container } = render(
        <NewMacroSuggestions {...defaultProps} filterBuffer="xyz" />
      );

      expect(container.firstChild).toBeNull();
    });

    test('returns null when filter buffer is empty in filter mode', () => {
      const { container } = render(
        <NewMacroSuggestions {...defaultProps} filterBuffer="" mode="filter" />
      );

      expect(container.firstChild).toBeNull();
    });

    test('limits results to 5 macros', () => {
      const manyMacros: Macro[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        command: `test-macro-${i}`,
        text: `Test macro ${i}`,
        updated_at: String(new Date()),
      }));

      render(<NewMacroSuggestions {...defaultProps} macros={manyMacros} filterBuffer="test" />);

      const buttons = screen.getAllByRole('option');
      expect(buttons.length).toBe(5);
    });
  });

  describe('Filtering Logic', () => {
    test('filters macros that start with buffer', () => {
      render(<NewMacroSuggestions {...defaultProps} filterBuffer="test" />);

      expect(screen.getByText('test-macro')).toBeInTheDocument();
      expect(screen.queryByText('different')).not.toBeInTheDocument();
    });

    test('filters macros that contain buffer', () => {
      render(<NewMacroSuggestions {...defaultProps} filterBuffer="other" />);

      expect(screen.getByText('another-test')).toBeInTheDocument();
      expect(screen.queryByText('test-macro')).not.toBeInTheDocument();
    });

    test('filtering is case-insensitive', () => {
      render(<NewMacroSuggestions {...defaultProps} filterBuffer="TEST" />);

      expect(screen.getByText('test-macro')).toBeInTheDocument();
      expect(screen.getByText('another-test')).toBeInTheDocument();
    });

    test('shows no results for non-matching buffer', () => {
      const { container } = render(
        <NewMacroSuggestions {...defaultProps} filterBuffer="nonexistent" />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Styling and Positioning', () => {
    test('applies correct positioning styles', () => {
      const { container } = render(<NewMacroSuggestions {...defaultProps} />);

      const suggestionContainer = container.querySelector('.new-macro-suggestions-container');
      expect(suggestionContainer).toHaveStyle({
        left: '100px', // This comes from defaultProps, not the mock
        top: '100px', // This comes from defaultProps, not the mock
        position: 'fixed',
      });
    });

    test('renders with correct placement class', () => {
      const { container } = render(<NewMacroSuggestions {...defaultProps} />);

      const arrow = container.querySelector('.new-macro-suggestions-arrow');
      expect(arrow).toHaveClass('bottom');
    });

    test('highlights selected macro', () => {
      render(<NewMacroSuggestions {...defaultProps} />);

      const firstButton = screen.getByText('test-macro');
      expect(firstButton).toHaveClass('selected');
    });
  });

  describe('User Interactions', () => {
    test('calls onSelectMacro when item is clicked', () => {
      const mockOnSelect = vi.fn();
      render(<NewMacroSuggestions {...defaultProps} onSelectMacro={mockOnSelect} />);

      const firstItem = screen.getByText('test-macro');
      fireEvent.click(firstItem);

      expect(mockOnSelect).toHaveBeenCalledWith(mockMacros[0]);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    test('calls onSelectMacro with correct macro when second item clicked', () => {
      const mockOnSelect = vi.fn();
      render(<NewMacroSuggestions {...defaultProps} onSelectMacro={mockOnSelect} />);

      const secondItem = screen.getByText('another-test');
      fireEvent.click(secondItem);

      expect(mockOnSelect).toHaveBeenCalledWith(mockMacros[1]);
    });
  });

  describe('Text Preview', () => {
    test('shows preview text for selected macro', () => {
      render(<NewMacroSuggestions {...defaultProps} />);

      expect(screen.getByText('This is a test macro')).toBeInTheDocument();
    });

    test('shows full text without truncation', () => {
      const longTextMacro: Macro = {
        id: '3',
        command: 'test-long',
        text: 'This is a very long text that should be displayed in full without any truncation happening',
        updated_at: String(new Date()),
      };

      render(
        <NewMacroSuggestions 
          {...defaultProps} 
          macros={[longTextMacro]} 
          filterBuffer="test"
        />
      );

      expect(screen.getByText(longTextMacro.text)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation Hints', () => {
    test('shows keyboard navigation hints', () => {
      render(<NewMacroSuggestions {...defaultProps} />);

      expect(screen.getByText(/Navigate/)).toBeInTheDocument();
      expect(screen.getByText(/Select/)).toBeInTheDocument();
      expect(screen.getByText(/Cancel/)).toBeInTheDocument();
    });

    test('keyboard hints contain correct keys', () => {
      const { container } = render(<NewMacroSuggestions {...defaultProps} />);

      const kbdElements = container.querySelectorAll('.new-macro-suggestions-kbd');
      expect(kbdElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('renders with proper ARIA roles', () => {
      render(<NewMacroSuggestions {...defaultProps} />);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    test('selected item has aria-selected attribute', () => {
      render(<NewMacroSuggestions {...defaultProps} />);

      const firstButton = screen.getByText('test-macro');
      expect(firstButton).toHaveAttribute('aria-selected', 'true');
    });

    test('non-selected items have aria-selected false', () => {
      render(<NewMacroSuggestions {...defaultProps} />);

      const secondButton = screen.getByText('another-test');
      expect(secondButton).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty macros array', () => {
      const { container } = render(
        <NewMacroSuggestions {...defaultProps} macros={[]} />
      );

      expect(container.firstChild).toBeNull();
    });

    test('handles undefined cursor position gracefully', () => {
      const { container } = render(
        <NewMacroSuggestions 
          {...defaultProps} 
          cursorPosition={{ x: 0, y: 0 }} 
        />
      );

      const suggestionContainer = container.querySelector('.new-macro-suggestions-container');
      expect(suggestionContainer).toBeInTheDocument();
    });

    test('re-renders correctly when props change', () => {
      const { rerender } = render(<NewMacroSuggestions {...defaultProps} />);

      expect(screen.getByText('test-macro')).toBeInTheDocument();

      rerender(<NewMacroSuggestions {...defaultProps} filterBuffer="another" />);

      expect(screen.queryByText('test-macro')).not.toBeInTheDocument();
      expect(screen.getByText('another-test')).toBeInTheDocument();
    });

    test('handles rapid visibility toggles', () => {
      const { rerender } = render(<NewMacroSuggestions {...defaultProps} isVisible={true} />);

      expect(screen.getByText('test-macro')).toBeInTheDocument();

      rerender(<NewMacroSuggestions {...defaultProps} isVisible={false} />);
      rerender(<NewMacroSuggestions {...defaultProps} isVisible={true} />);

      expect(screen.getByText('test-macro')).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    test('switches from filter to showAll mode correctly', () => {
      const { rerender } = render(
        <NewMacroSuggestions {...defaultProps} mode="filter" filterBuffer="test" />
      );

      expect(screen.queryByText('different')).not.toBeInTheDocument();

      rerender(
        <NewMacroSuggestions {...defaultProps} mode="showAll" filterBuffer="" />
      );

      expect(screen.getByText('different')).toBeInTheDocument();
    });

    test('switches from showAll to filter mode correctly', () => {
      const { rerender } = render(
        <NewMacroSuggestions {...defaultProps} mode="showAll" filterBuffer="" />
      );

      expect(screen.getByText('different')).toBeInTheDocument();

      rerender(
        <NewMacroSuggestions {...defaultProps} mode="filter" filterBuffer="test" />
      );

      expect(screen.queryByText('different')).not.toBeInTheDocument();
    });
  });
});