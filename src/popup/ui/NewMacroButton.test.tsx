// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewMacroButton from './NewMacroButton';

// Mock chrome APIs
const mockTabsCreate = vi.fn();
const mockGetURL = vi.fn((path) => `chrome-extension://mock-id/${path}`);
vi.stubGlobal('chrome', {
  runtime: {
    getURL: mockGetURL,
  },
  tabs: {
    create: mockTabsCreate,
  },
});

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}));

describe('NewMacroButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the button with the correct text', () => {
    render(<NewMacroButton />);
    expect(screen.getByRole('button', { name: '+ popup.newMacro' })).toBeInTheDocument();
  });

  it('calls chrome.tabs.create with the correct editor URL when clicked', () => {
    render(<NewMacroButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockTabsCreate).toHaveBeenCalledTimes(1);
    expect(mockGetURL).toHaveBeenCalledWith('src/editor/index.html');
    expect(mockTabsCreate).toHaveBeenCalledWith({ url: 'chrome-extension://mock-id/src/editor/index.html' });
  });
});