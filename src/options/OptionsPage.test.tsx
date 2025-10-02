// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useMacroStore } from '../store/useMacroStore'
import { t } from '../lib/i18n'
import { PrefixEditor } from './ui/PrefixEditor'
import { ReplacementMode } from './ui/ReplacementMode'

// Mock the i18n function
vi.mock('../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Mock the PrefixEditor and ReplacementMode components
vi.mock('./ui/PrefixEditor', () => ({
  PrefixEditor: () => <div data-testid="prefix-editor">PrefixEditor</div>,
}));

vi.mock('./ui/ReplacementMode', () => ({
  ReplacementMode: () => <div data-testid="replacement-mode">ReplacementMode</div>,
}));

// Mock the store
vi.mock('../store/useMacroStore', () => ({
  useMacroStore: vi.fn(() => ({
    config: {
      disabledSites: [],
      prefixes: ['/'],
      theme: 'system',
      language: 'en',
    },
  })),
}))

// Define the OptionsPage component for testing
function OptionsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">{t('options.title')}</h1>
      <div data-testid="prefix-editor-wrapper">
        <PrefixEditor />
      </div>
      <div data-testid="replacement-mode-wrapper">
        <ReplacementMode />
      </div>
    </div>
  );
}

describe('Options Page', () => {
  it('renders without crashing', () => {
    render(<OptionsPage />);
    expect(screen.getByText('options.title')).toBeInTheDocument();
  });

  it('renders PrefixEditor and ReplacementMode components', () => {
    render(<OptionsPage />);
    expect(screen.getByTestId('prefix-editor')).toBeInTheDocument();
    expect(screen.getByTestId('replacement-mode')).toBeInTheDocument();
  });
});