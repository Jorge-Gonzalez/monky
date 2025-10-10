import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MacroSearchOverlay } from './MacroSearchOverlay';
import { useMacroStore } from '../../../../store/useMacroStore';
import { Macro } from '../../../../types';

// Mock fuzzysort for predictable search behavior in tests
vi.mock('fuzzysort', () => ({
  default: {
    go: vi.fn((query: string, targets: any[], options: any) => {
      if (!query.trim()) return targets.map((obj: any) => ({ obj }));
      
      return targets
        .filter((macro: any) => 
          macro.command.toLowerCase().includes(query.toLowerCase()) || 
          macro.text.toLowerCase().includes(query.toLowerCase())
        )
        .map((obj: any) => ({ obj }));
    }),
  },
}));

// Mock only the hooks that don't affect core functionality

vi.mock('../hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: vi.fn(),
}));

vi.mock('../../../../theme/hooks/useThemeColors', () => ({
  useThemeColors: vi.fn(),
}));

vi.mock('../hooks/useScrollIntoView', () => ({
  useScrollIntoView: vi.fn(),
}));

vi.mock('../hooks/useAutoFocus', () => ({
  useAutoFocus: vi.fn(),
}));

// Mock Zustand store
const mockMacros: Macro[] = [
  { id: '1', command: '/sig', text: 'My Signature', contentType: 'text/plain' },
  { id: '2', command: '/bug', text: 'Bug report template', contentType: 'text/plain' },
  { id: '3', command: '/feat', text: 'Feature request template', contentType: 'text/plain' },
];

vi.mock('../../../../store/useMacroStore', () => ({
  useMacroStore: vi.fn(),
}));

describe('MacroSearchOverlay', () => {
  const onClose = vi.fn();
  const onSelectMacro = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useMacroStore as vi.Mock).mockImplementation(selector => {
      const state = {
        macros: mockMacros,
        config: {
          theme: 'light',
        },
      };
      return selector(state);
    });
  });

  const defaultProps = {
    isVisible: true,
    onClose,
    onSelectMacro,
    position: { x: 0, y: 0 },
  };

  it('should not render when isVisible is false', () => {
    render(<MacroSearchOverlay {...defaultProps} isVisible={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render the overlay with all macros when visible and search is empty', () => {
    render(<MacroSearchOverlay {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search macros...')).toBeInTheDocument();
    expect(screen.getByText('/sig')).toBeInTheDocument();
    expect(screen.getByText('/bug')).toBeInTheDocument();
    expect(screen.getByText('/feat')).toBeInTheDocument();
  });

  it('should filter macros based on search query', async () => {
    render(<MacroSearchOverlay {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search macros...');

    fireEvent.change(input, { target: { value: 'bug' } });

    expect(screen.queryByText('/sig')).not.toBeInTheDocument();
    expect(await screen.findByText('/bug')).toBeInTheDocument();
    expect(screen.queryByText('/feat')).not.toBeInTheDocument();
  });

  it('should call onClose when the backdrop is clicked', () => {
    render(<MacroSearchOverlay {...defaultProps} />);
    // The backdrop is the parent div of the modal
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when the modal content is clicked', () => {
    render(<MacroSearchOverlay {...defaultProps} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onSelectMacro and onClose when a macro is clicked', () => {
    render(<MacroSearchOverlay {...defaultProps} />);
    const macroItem = screen.getByText('/bug');

    fireEvent.click(macroItem);

    expect(onSelectMacro).toHaveBeenCalledWith(mockMacros[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should reset search query when re-opened', () => {
    const { rerender } = render(<MacroSearchOverlay {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search macros...') as HTMLInputElement;

    // Type something
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input.value).toBe('test');

    // "Close" the component
    rerender(<MacroSearchOverlay {...defaultProps} isVisible={false} />);

    // "Re-open" the component
    rerender(<MacroSearchOverlay {...defaultProps} isVisible={true} />);

    // Check if the input is cleared
    const reopenedInput = screen.getByPlaceholderText('Search macros...') as HTMLInputElement;
    expect(reopenedInput.value).toBe('');
  });

  it('should display an empty state message when no macros match the search', async () => {
    render(<MacroSearchOverlay {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search macros...');

    fireEvent.change(input, { target: { value: 'nonexistent' } });

    expect(await screen.findByText('No macros found')).toBeInTheDocument();
  });
});