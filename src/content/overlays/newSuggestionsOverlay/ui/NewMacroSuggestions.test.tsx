import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
  usePopupPosition: vi.fn(() => ({ x: 100, y: 100, placement: 'bottom' })),
  calculateOptimalPosition: vi.fn(() => ({ x: 100, y: 100, placement: 'bottom' })),
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
];

const defaultProps = {
  macros: mockMacros,
  buffer: 'test',
  cursorPosition: { x: 100, y: 100 },
  isVisible: true,
  selectedIndex: 0,
  onSelectMacro: vi.fn(),
  onClose: vi.fn(),
};

describe('NewMacroSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders when visible and has matching macros', () => {
    render(<NewMacroSuggestions {...defaultProps} buffer="test" />);

    expect(screen.getByText('test-macro')).toBeInTheDocument();
    expect(screen.getByText('This is a test macro')).toBeInTheDocument();
    expect(screen.getByText('another-test')).toBeInTheDocument();
    expect(screen.getByText('This is another test macro')).toBeInTheDocument();
  });

  test('does not render when invisible', () => {
    render(<NewMacroSuggestions {...defaultProps} isVisible={false} />);

    expect(screen.queryByTestId('new-macro-suggestions-container')).not.toBeInTheDocument();
  });

  test('does not render when no matching macros', () => {
    render(<NewMacroSuggestions {...defaultProps} macros={[]} buffer="nonexistent" />);

    expect(screen.queryByTestId('new-macro-suggestions-container')).not.toBeInTheDocument();
  });

  test('renders with correct placement class', () => {
    render(<NewMacroSuggestions {...defaultProps} />);

    const container = screen.getByText('test-macro').closest('.new-macro-suggestions-container');
    expect(container).toBeInTheDocument();
  });

  test('highlights selected macro', () => {
    render(<NewMacroSuggestions {...defaultProps} selectedIndex={0} />);

    const firstItem = screen.getByText('test-macro').closest('.new-macro-suggestions-item');
    expect(firstItem).toHaveClass('selected');
  });

  test('calls onSelectMacro when item is clicked', () => {
    const mockOnSelect = vi.fn();
    render(<NewMacroSuggestions {...defaultProps} onSelectMacro={mockOnSelect} />);

    const firstItem = screen.getByText('test-macro').closest('.new-macro-suggestions-item');
    fireEvent.click(firstItem!);

    expect(mockOnSelect).toHaveBeenCalledWith(mockMacros[0]);
  });

  test('shows truncated text for long macro text', () => {
    const longTextMacro: Macro = {
      id: '3',
      command: 'long-macro',
      text: 'This is a very long text that should be truncated to show only the first 30 characters',
      updated_at: String(new Date()),
    };

    render(<NewMacroSuggestions {...defaultProps} macros={[longTextMacro]} buffer="long" />);

    expect(screen.getByText('This is a very long text that ...')).toBeInTheDocument();
  });

  test('shows keyboard navigation hints', () => {
    render(<NewMacroSuggestions {...defaultProps} />);

    expect(screen.getByText(/Navigate/)).toBeInTheDocument();
    expect(screen.getByText(/Select/)).toBeInTheDocument();
    expect(screen.getByText(/Cancel/)).toBeInTheDocument();
  });
});