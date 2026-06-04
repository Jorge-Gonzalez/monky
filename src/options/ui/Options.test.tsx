// @vitest-environment jsdom
import { render, screen } from '@testing-library/preact'
import { describe, it, expect, vi, Mock, beforeEach } from 'vitest'
import Options from './Options'
import { useOptions } from '../useOptions'

vi.mock('../../lib/i18n', () => ({ t: (key: string) => key }))

vi.mock('./PrefixEditor', () => ({
  __esModule: true,
  default: () => <div data-testid="prefix-editor">PrefixEditor</div>,
}))

vi.mock('./ReplacementMode', () => ({
  __esModule: true,
  default: () => <div data-testid="replacement-mode">ReplacementMode</div>,
}))

vi.mock('../useOptions', () => ({ useOptions: vi.fn() }))

describe('Options page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useOptions as Mock).mockReturnValue({
      prefixes: ['/'],
      useCommitKeys: false,
      language: 'en',
      colorTheme: 'humo',
      setUseCommitKeys: vi.fn(),
      setLanguage: vi.fn(),
      setColorTheme: vi.fn(),
      togglePrefix: vi.fn(() => true),
    })
  })

  it('renders the title', () => {
    render(<Options />)
    expect(screen.getByText('options.title')).toBeInTheDocument()
  })

  it('renders PrefixEditor and ReplacementMode', () => {
    render(<Options />)
    expect(screen.getByTestId('prefix-editor')).toBeInTheDocument()
    expect(screen.getByTestId('replacement-mode')).toBeInTheDocument()
  })
})
