// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import ThemeSwitcher from './ThemeSwitcher';
import { PopupManager } from '../managers/createPopupManager';

// Mock the manager hook
vi.mock('../managers/usePopupManager', () => ({
  usePopupManager: vi.fn(),
}));

const createMockPopupManager = (): Partial<PopupManager> => ({
  setTheme: vi.fn(),
});

describe('ThemeSwitcher Component', () => {
  let mockManager: Partial<PopupManager>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockManager = createMockPopupManager();

    // Mock the implementation of the hook before each test
    const usePopupManagerModule = vi.mocked(
      (await import('../managers/usePopupManager')) as any
    );
    usePopupManagerModule.usePopupManager.mockReturnValue(mockManager);
  });

  it('renders all three theme buttons', () => {
    render(<ThemeSwitcher />);
    expect(screen.getByRole('button', { name: /light theme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dark theme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /system theme/i })).toBeInTheDocument();
  });

  it('calls manager.setTheme with "light" when the light theme button is clicked', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /light theme/i }));
    expect(mockManager.setTheme).toHaveBeenCalledWith('light');
    expect(mockManager.setTheme).toHaveBeenCalledTimes(1);
  });

  it('calls manager.setTheme with correct values for all buttons', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /dark theme/i }));
    expect(mockManager.setTheme).toHaveBeenCalledWith('dark');
    fireEvent.click(screen.getByRole('button', { name: /system theme/i }));
    expect(mockManager.setTheme).toHaveBeenCalledWith('system');
  });
});