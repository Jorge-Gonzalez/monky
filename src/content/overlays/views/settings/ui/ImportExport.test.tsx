import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'

const mockUseMacroStore = vi.hoisted(() => vi.fn())
const mockAddMacro = vi.fn()
const mockParseMacroImport = vi.fn()
const mockMergeImport = vi.fn()

vi.mock('../../../../../store/useMacroStore', () => {
  ;(mockUseMacroStore as any).getState = () => ({ config: { language: 'en' } })
  return { useMacroStore: mockUseMacroStore }
})

vi.mock('../../../../../lib/macroIO', () => ({
  serializeMacros: vi.fn(),
  parseMacroImport: (...args: any[]) => mockParseMacroImport(...args),
  mergeImport: (...args: any[]) => mockMergeImport(...args),
}))

import { ImportExport } from './ImportExport'

describe('ImportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // jsdom's FileReader doesn't reliably fire onload; stub it to call onload asynchronously
    vi.stubGlobal('FileReader', vi.fn(() => {
      const reader: any = { result: '[]', onload: null }
      reader.readAsText = () => { Promise.resolve().then(() => reader.onload?.()) }
      return reader
    }))

    mockAddMacro.mockReturnValue({ success: true })
    mockUseMacroStore.mockImplementation((selector: any) =>
      selector({ macros: [], addMacro: mockAddMacro })
    )
    mockParseMacroImport.mockReturnValue([
      { command: '/uno', text: 'Uno', contentType: 'text/plain' },
    ])
    mockMergeImport.mockImplementation((parsed: any[], _existing: any, addFn: (m: any) => any) => {
      parsed.forEach(m => addFn(m))
      return { added: parsed.length, skipped: 0 }
    })
  })

  it('imports macros through file upload and shows a success status', async () => {
    const { container } = render(<ImportExport />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    const file = new File([
      JSON.stringify([
        { command: '/uno', text: 'Uno', contentType: 'text/plain' },
      ]),
    ], 'macros.json', { type: 'application/json' })

    await userEvent.upload(fileInput, file)

    await waitFor(() => {
      expect(mockParseMacroImport).toHaveBeenCalledWith(expect.any(String))
    })

    expect(mockMergeImport).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ command: '/uno' }),
      ]),
      expect.any(Set),
      expect.any(Function)
    )

    expect(mockAddMacro).toHaveBeenCalled()
    expect(screen.getByText('1 added')).toBeInTheDocument()
  })
})
