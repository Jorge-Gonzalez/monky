// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, Mock, beforeEach } from 'vitest'
import { t } from '../../lib/i18n'
import Options from './Options' // Import the actual component
import { useOptionsManager } from '../managers/useOptionsManager'
import { OptionsManager } from '../managers/createOptionsManager'

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

// Mock the manager hook
vi.mock('../managers/useOptionsManager', () => ({
  useOptionsManager: vi.fn(),
}))

const createMockManager = (): OptionsManager => {
  const unsubscribe = vi.fn();
  return {
    getState: vi.fn(() => ({ prefixes: ['/'], useCommitKeys: false })),
    subscribe: vi.fn(() => unsubscribe), // Return the mock unsubscribe function
    setPrefixes: vi.fn(),
    setUseCommitKeys: vi.fn(),
  };
}

describe('Options Component', () => {
  let mockManager: OptionsManager;

  beforeEach(() => {
    vi.clearAllMocks()
    mockManager = createMockManager()
    ;(useOptionsManager as Mock).mockReturnValue(mockManager)
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

  it('subscribes to the manager on mount and unsubscribes on unmount', () => {
    // Get the mock unsubscribe function that `subscribe` will return
    const mockUnsubscribe = mockManager.subscribe();
    // Reset the call count on subscribe itself before rendering
    (mockManager.subscribe as vi.Mock).mockClear();

    const { unmount } = render(<Options />)
    expect(mockManager.subscribe).toHaveBeenCalledTimes(1)
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1) // The unsubscribe function
  })
})