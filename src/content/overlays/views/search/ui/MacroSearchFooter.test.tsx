import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { MacroSearchFooter } from './MacroSearchFooter';

describe('MacroSearchFooter — count label', () => {
  it('renders "1 macro" in macro mode', () => {
    render(<MacroSearchFooter count={1} isCommandMode={false} />);
    expect(screen.getByText('1 macro')).toBeTruthy();
  });

  it('renders "3 macros" in macro mode', () => {
    render(<MacroSearchFooter count={3} isCommandMode={false} />);
    expect(screen.getByText('3 macros')).toBeTruthy();
  });

  it('renders "0 macros" in macro mode', () => {
    render(<MacroSearchFooter count={0} isCommandMode={false} />);
    expect(screen.getByText('0 macros')).toBeTruthy();
  });

  it('renders "1 command" in command mode', () => {
    render(<MacroSearchFooter count={1} isCommandMode={true} />);
    expect(screen.getByText('1 command')).toBeTruthy();
  });

  it('renders "4 commands" in command mode', () => {
    render(<MacroSearchFooter count={4} isCommandMode={true} />);
    expect(screen.getByText('4 commands')).toBeTruthy();
  });

  it('renders "0 commands" in command mode', () => {
    render(<MacroSearchFooter count={0} isCommandMode={true} />);
    expect(screen.getByText('0 commands')).toBeTruthy();
  });
});

describe('MacroSearchFooter — keyboard hints', () => {
  it('shows ":" commands hint in macro mode', () => {
    const { container } = render(<MacroSearchFooter count={2} isCommandMode={false} />);
    // The colon is its own <kbd> element
    expect(screen.getByText(':')).toBeTruthy();
    expect(container.textContent).toContain('select');
  });

  it('does not show ":" commands hint in command mode', () => {
    render(<MacroSearchFooter count={2} isCommandMode={true} />);
    // In command mode the <kbd>:</kbd> element is absent
    expect(screen.queryByText(':')).toBeNull();
  });

  it('shows "run" hint in command mode', () => {
    const { container } = render(<MacroSearchFooter count={2} isCommandMode={true} />);
    expect(container.textContent).toContain('run');
  });

  it('shows "close" hint in both modes', () => {
    const { container, unmount } = render(<MacroSearchFooter count={1} isCommandMode={false} />);
    expect(container.textContent).toContain('close');
    unmount();

    const { container: c2 } = render(<MacroSearchFooter count={1} isCommandMode={true} />);
    expect(c2.textContent).toContain('close');
  });
});
