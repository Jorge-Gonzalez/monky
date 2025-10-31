// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import PrefixEditor from './PrefixEditor'
import { OptionsCoordinator } from '../coordinators/optionsCoordinator'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Helper to create a mock coordinator
const createMockCoordinator = (): OptionsCoordinator => ({
  setPrefixes: vi.fn(),
  setUseCommitKeys: vi.fn(),
  getState: vi.fn(() => ({ prefixes: [], useCommitKeys: false })),
  subscribe: vi.fn(() => () => {}),
  resetToDefaults: vi.fn(),
  attach: vi.fn(),
  detach: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  isEnabled: vi.fn(() => true),
  destroy: vi.fn(),
})

describe('PrefixEditor Component', () => {
  let mockCoordinator: OptionsCoordinator

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockCoordinator = createMockCoordinator()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders without crashing', () => {
    const initialPrefixes = ['/', '#']
    render(<PrefixEditor coordinator={mockCoordinator} prefixes={initialPrefixes} />)
    expect(screen.getByText('options.prefixEditor.title')).toBeInTheDocument()
    expect(screen.getByText('options.prefixEditor.description')).toBeInTheDocument()
  })

  it('renders buttons and sets the correct aria-checked state', () => {
    const initialPrefixes = ['/', '#']
    render(<PrefixEditor coordinator={mockCoordinator} prefixes={initialPrefixes} />)

    const slashButton = screen.getByRole('switch', { name: '/' })
    const hashButton = screen.getByRole('switch', { name: '#' })
    const semicolonButton = screen.getByRole('switch', { name: ';' })

    expect(slashButton).toHaveAttribute('aria-checked', 'true')
    expect(hashButton).toHaveAttribute('aria-checked', 'true')
    expect(semicolonButton).toHaveAttribute('aria-checked', 'false')
  })

  it('calls coordinator.setPrefixes with the new array when a prefix is added', () => {
    const initialPrefixes = ['/', '#']
    render(<PrefixEditor coordinator={mockCoordinator} prefixes={initialPrefixes} />)

    const semicolonButton = screen.getByRole('switch', { name: ';' })
    fireEvent.click(semicolonButton)
    expect(mockCoordinator.setPrefixes).toHaveBeenCalledWith(['/', '#', ';'])
  })

  it('calls coordinator.setPrefixes with the new array when a prefix is removed', () => {
    const initialPrefixes = ['/', '#']
    render(<PrefixEditor coordinator={mockCoordinator} prefixes={initialPrefixes} />)

    const slashButton = screen.getByRole('switch', { name: '/' })
    fireEvent.click(slashButton)
    expect(mockCoordinator.setPrefixes).toHaveBeenCalledWith(['#'])
  })

  it('does not allow removing the last prefix', () => {
    // Arrange
    const initialPrefixes = ['/']
    render(<PrefixEditor coordinator={mockCoordinator} prefixes={initialPrefixes} />)

    const slashButton = screen.getByRole('switch', { name: '/' })
    expect(slashButton).toHaveAttribute('aria-checked', 'true')

    // Act: Try to uncheck the last prefix
    fireEvent.click(slashButton)

    // Assert
    expect(mockCoordinator.setPrefixes).not.toHaveBeenCalled()
  })

  it('provides visual feedback when trying to remove the last prefix', () => {
    // Arrange
    const initialPrefixes = ['/']
    render(<PrefixEditor coordinator={mockCoordinator} prefixes={initialPrefixes} />)
    const slashButton = screen.getByRole('switch', { name: '/' })

    // Act: Try to uncheck the last prefix
    fireEvent.click(slashButton)

    // Assert: The shake animation class is applied
    expect(slashButton).toHaveClass('animate-shake')

    // Assert: The class is removed after the animation duration
    act(() => {
      vi.advanceTimersByTime(400) // Matches timeout in component
    })
    expect(slashButton).not.toHaveClass('animate-shake')
  })
})