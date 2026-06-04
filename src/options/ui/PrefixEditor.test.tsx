// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi } from 'vitest'
import PrefixEditor from './PrefixEditor'

vi.mock('../../lib/i18n', () => ({ t: (key: string) => key }))

describe('PrefixEditor', () => {
  it('renders the section title and description', () => {
    render(<PrefixEditor prefixes={['/']} onChange={vi.fn()} />)
    expect(screen.getByText('options.prefixEditor.title')).toBeInTheDocument()
    expect(screen.getByText('options.prefixEditor.description')).toBeInTheDocument()
  })

  it('renders the prefix group and forwards changes', () => {
    const onChange = vi.fn()
    render(<PrefixEditor prefixes={['/']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('switch', { name: ';' }))
    expect(onChange).toHaveBeenCalledWith(['/', ';'])
  })
})
