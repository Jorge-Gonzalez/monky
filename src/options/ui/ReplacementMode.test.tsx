// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReplacementMode from './ReplacementMode'
import { OptionsCoordinator } from '../coordinators/optionsCoordinator'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Helper to create a mock coordinator
const createMockCoordinator = (): OptionsCoordinator => ({
  setUseCommitKeys: vi.fn(),
  setPrefixes: vi.fn(),
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

describe('ReplacementMode Component', () => {
  let mockCoordinator: OptionsCoordinator

  beforeEach(() => {
    vi.clearAllMocks()
    mockCoordinator = createMockCoordinator()
  })

  it('renders without crashing', () => {
    render(<ReplacementMode coordinator={mockCoordinator} useCommitKeys={false} />)
    expect(screen.getByText('replacementMode.title')).toBeInTheDocument()
    expect(screen.getByLabelText('replacementMode.auto')).toBeInTheDocument()
    expect(screen.getByLabelText('replacementMode.manual')).toBeInTheDocument()
  })

  it('selects "auto" by default when useCommitKeys is false', () => {
    render(<ReplacementMode coordinator={mockCoordinator} useCommitKeys={false} />)
    const autoRadio = screen.getByLabelText('replacementMode.auto')
    const manualRadio = screen.getByLabelText('replacementMode.manual')

    expect(autoRadio).toBeChecked()
    expect(manualRadio).not.toBeChecked()
  })

  it('selects "auto" by default when useCommitKeys is undefined', () => {
    // Arrange: Pass undefined for useCommitKeys
    render(<ReplacementMode coordinator={mockCoordinator} useCommitKeys={undefined as any} />)

    // Assert: The component should default to 'auto'
    expect(screen.getByLabelText('replacementMode.auto')).toBeChecked()
  })

  it('selects "manual" when useCommitKeys is true', () => {
    // Arrange: Pass true for useCommitKeys
    render(<ReplacementMode coordinator={mockCoordinator} useCommitKeys={true} />)

    // Assert
    expect(screen.getByLabelText('replacementMode.manual')).toBeChecked()
    expect(screen.getByLabelText('replacementMode.auto')).not.toBeChecked()
  })

  it('calls coordinator.setUseCommitKeys with correct values when radio buttons are clicked', () => {
    // Destructure rerender from the initial render
    const { rerender } = render(<ReplacementMode coordinator={mockCoordinator} useCommitKeys={false} />)

    // 1. Click 'manual'
    const manualRadio = screen.getByLabelText('replacementMode.manual')
    fireEvent.click(manualRadio)
    expect(mockCoordinator.setUseCommitKeys).toHaveBeenCalledWith(true)

    // 2. Rerender the component with the new prop value to simulate the state update
    rerender(<ReplacementMode coordinator={mockCoordinator} useCommitKeys={true} />)

    // 2. Click 'auto'
    const autoRadio = screen.getByLabelText('replacementMode.auto')
    fireEvent.click(autoRadio)
    expect(mockCoordinator.setUseCommitKeys).toHaveBeenCalledWith(false)
    expect(mockCoordinator.setUseCommitKeys).toHaveBeenCalledTimes(2)
  })
})