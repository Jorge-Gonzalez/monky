// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, Mock, beforeEach } from 'vitest'
import { t } from '../../lib/i18n'
import Options from './Options' // Import the actual component
import { useOptionsCoordinator } from '../hooks/useOptionsCoordinator'
import { OptionsCoordinator } from '../coordinators/optionsCoordinator'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Mock the PrefixEditor and ReplacementMode components
vi.mock('./PrefixEditor', () => ({ // Use default export
  __esModule: true, // Handle default export
  default: () => <div data-testid="prefix-editor">PrefixEditor</div>,
}));

vi.mock('./ReplacementMode', () => ({ // Use default export
  __esModule: true, // Handle default export
  default: () => <div data-testid="replacement-mode">ReplacementMode</div>,
}));

// Mock the coordinator hook
vi.mock('../hooks/useOptionsCoordinator', () => ({
  useOptionsCoordinator: vi.fn(),
}))

const createMockCoordinator = (): OptionsCoordinator => {
  const unsubscribe = vi.fn();
  return {
    getState: vi.fn(() => ({ prefixes: ['/'], useCommitKeys: false })),
    subscribe: vi.fn(() => unsubscribe), // Return the mock unsubscribe function
    setPrefixes: vi.fn(),
    setUseCommitKeys: vi.fn(),
    resetToDefaults: vi.fn(),
    attach: vi.fn(),
    detach: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    isEnabled: vi.fn(() => true),
    destroy: vi.fn(),
  };
}

describe('Options Component', () => {
  let mockCoordinator: OptionsCoordinator;

  beforeEach(() => {
    vi.clearAllMocks()
    mockCoordinator = createMockCoordinator()
    ;(useOptionsCoordinator as Mock).mockReturnValue(mockCoordinator)
  })

  it('renders without crashing', () => {
    render(<Options />)
    expect(screen.getByText('options.title')).toBeInTheDocument()
  })

  it('renders PrefixEditor and ReplacementMode components', () => {
    render(<Options />)
    expect(screen.getByTestId('prefix-editor')).toBeInTheDocument()
    expect(screen.getByTestId('replacement-mode')).toBeInTheDocument()
  })

  it('subscribes to the coordinator on mount and unsubscribes on unmount', () => {
    const { unmount } = render(<Options />)
    expect(mockCoordinator.subscribe).toHaveBeenCalledTimes(1)

    // Get the unsubscribe function that was returned
    const unsubscribeFn = (mockCoordinator.subscribe as any).mock.results[0].value

    unmount()
    expect(unsubscribeFn).toHaveBeenCalledTimes(1)
  })
})