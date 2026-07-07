// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const options = [
  { value: 'auto', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
]

describe('SegmentedControl', () => {
  it('renders every option and marks the selected one', () => {
    const { getAllByRole } = render(
      <SegmentedControl options={options} value="auto" onChange={() => {}} />
    )
    const radios = getAllByRole('radio')
    expect(radios.map(r => r.textContent)).toEqual(['Automatic', 'Manual'])
    expect(radios[0].getAttribute('aria-checked')).toBe('true')
    expect(radios[1].getAttribute('aria-checked')).toBe('false')
  })

  it('reports the clicked value', () => {
    const onChange = vi.fn()
    const { getByText } = render(
      <SegmentedControl options={options} value="auto" onChange={onChange} />
    )
    fireEvent.click(getByText('Manual'))
    expect(onChange).toHaveBeenCalledWith('manual')
  })

  it('moves the selection marker when the value changes', () => {
    const { getAllByRole, rerender } = render(
      <SegmentedControl options={options} value="auto" onChange={() => {}} />
    )
    rerender(<SegmentedControl options={options} value="manual" onChange={() => {}} />)
    const radios = getAllByRole('radio')
    expect(radios[1].getAttribute('aria-checked')).toBe('true')
    expect(radios[1].className).not.toContain('is-selected')
    expect(radios[0].className).not.toContain('is-selected')
  })

  it('relabels the same buttons when options change (language switch) without losing selection', () => {
    const { getAllByRole, rerender } = render(
      <SegmentedControl options={options} value="manual" onChange={() => {}} />
    )
    const relabeled = [
      { value: 'auto', label: 'Automático' },
      { value: 'manual', label: 'Manual' },
    ]
    rerender(<SegmentedControl options={relabeled} value="manual" onChange={() => {}} />)
    const radios = getAllByRole('radio')
    expect(radios.map(r => r.textContent)).toEqual(['Automático', 'Manual'])
    expect(radios[1].getAttribute('aria-checked')).toBe('true')
  })

  it('supports icon labels with an aria-label for screen readers', () => {
    const iconOptions = [
      { value: 'light', label: <svg data-testid="sun" />, ariaLabel: 'Light mode' },
      { value: 'dark', label: <svg data-testid="moon" />, ariaLabel: 'Dark mode' },
    ]
    const onChange = vi.fn()
    const { getByLabelText, getByTestId } = render(
      <SegmentedControl options={iconOptions} value="light" onChange={onChange} />
    )
    expect(getByTestId('sun')).toBeInTheDocument()
    expect(getByLabelText('Dark mode').getAttribute('aria-checked')).toBe('false')
    fireEvent.click(getByLabelText('Dark mode'))
    expect(onChange).toHaveBeenCalledWith('dark')
  })
})
