// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useMacroStore } from '../../store/useMacroStore'
import { ReplacementMode } from './ReplacementMode'

// Mock the i18n function
vi.mock('../../lib/i18n', () => ({
  t: (key: string) => key,
}))

// Mock the store consistently
const mockState = {
  config: { useCommitKeys: false },
  setUseCommitKeys: vi.fn((value: boolean) => {
    mockState.config.useCommitKeys = value
  }),
}
const mockSetUseCommitKeys = mockState.setUseCommitKeys

// Mock the store
vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: vi.fn().mockImplementation(selector => (selector ? selector(mockState) : mockState)),
}))

describe('ReplacementMode Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock state before each test
    mockState.config.useCommitKeys = false
  })

  it('renders without crashing', () => {
    render(<ReplacementMode />)
    expect(screen.getByText('replacementMode.title')).toBeInTheDocument()
    expect(screen.getByLabelText('replacementMode.auto')).toBeInTheDocument()
    expect(screen.getByLabelText('replacementMode.manual')).toBeInTheDocument()
  })

  it('selects "auto" by default when useCommitKeys is false', () => {
    render(<ReplacementMode />)
    const autoRadio = screen.getByLabelText('replacementMode.auto')
    const manualRadio = screen.getByLabelText('replacementMode.manual')

    expect(autoRadio).toBeChecked()
    expect(manualRadio).not.toBeChecked()
  })

  it('selects "auto" by default when useCommitKeys is undefined', () => {
    // Arrange: Simulate the state where the key is not yet defined
    mockState.config.useCommitKeys = undefined as any
    render(<ReplacementMode />)

    // Assert: The component should default to 'auto'
    expect(screen.getByLabelText('replacementMode.auto')).toBeChecked()
  })

  it('selects "manual" when useCommitKeys is true', () => {
    // Arrange: Set the initial state for this test
    mockState.config.useCommitKeys = true
    render(<ReplacementMode />)

    // Assert
    expect(screen.getByLabelText('replacementMode.manual')).toBeChecked()
    expect(screen.getByLabelText('replacementMode.auto')).not.toBeChecked()
  })

  it('calls setUseCommitKeys with correct values when radio buttons are clicked', () => {
    const { rerender } = render(<ReplacementMode />)

    // 1. Click 'manual'
    const manualRadio = screen.getByLabelText('replacementMode.manual')
    fireEvent.click(manualRadio)
    expect(mockSetUseCommitKeys).toHaveBeenCalledWith(true)

    // Re-render the component to reflect the state change
    rerender(<ReplacementMode />)

    // 2. Click 'auto'
    const autoRadio = screen.getByLabelText('replacementMode.auto')
    fireEvent.click(autoRadio)
    expect(mockSetUseCommitKeys).toHaveBeenCalledWith(false)
    expect(mockSetUseCommitKeys).toHaveBeenCalledTimes(2)
  })
})