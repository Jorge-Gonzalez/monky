// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReplacementMode from './ReplacementMode'

vi.mock('../../lib/i18n', () => ({ t: (key: string) => key }))

describe('ReplacementMode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders both options', () => {
    render(
      <ReplacementMode
        useCommitKeys={false}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('replacementMode.title')).toBeInTheDocument()
    expect(screen.getByLabelText('replacementMode.auto')).toBeInTheDocument()
    expect(screen.getByLabelText('replacementMode.manual')).toBeInTheDocument()
  })

  it('selects auto when useCommitKeys is false', () => {
    render(
      <ReplacementMode
        useCommitKeys={false}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('replacementMode.auto')).toBeChecked()
    expect(screen.getByLabelText('replacementMode.manual')).not.toBeChecked()
  })

  it('selects manual when useCommitKeys is true', () => {
    render(
      <ReplacementMode
        useCommitKeys={true}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('replacementMode.manual')).toBeChecked()
    expect(screen.getByLabelText('replacementMode.auto')).not.toBeChecked()
  })

  it('calls onChange with the chosen mode', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ReplacementMode
        useCommitKeys={false}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByLabelText('replacementMode.manual'))
    expect(onChange).toHaveBeenCalledWith(true)

    rerender(
      <ReplacementMode
        useCommitKeys={true}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByLabelText('replacementMode.auto'))
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
