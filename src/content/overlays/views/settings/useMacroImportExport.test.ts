// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/preact'

const mockAddMacro = vi.fn()
const mockParseMacroImport = vi.fn()
const mockMergeImport = vi.fn()

vi.mock('../../../../store/useMacroStore', () => ({
  useMacroStore: (selector: any) => selector({ macros: [], addMacro: mockAddMacro }),
}))
vi.mock('../../../../lib/macroIO', () => ({
  serializeMacros: vi.fn(() => '[]'),
  parseMacroImport: (...args: any[]) => mockParseMacroImport(...args),
  mergeImport: (...args: any[]) => mockMergeImport(...args),
}))
vi.mock('../../../../lib/i18n', () => ({ t: (key: string) => key }))

const mockTakeSnapshot = vi.fn()
vi.mock('../../../../store/macroSnapshots', () => ({
  takeSnapshot: (...args: any[]) => mockTakeSnapshot(...args),
}))

import { useMacroImportExport } from './useMacroImportExport'

describe('useMacroImportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom's FileReader doesn't reliably fire onload; stub it to fire asynchronously.
    vi.stubGlobal(
      'FileReader',
      vi.fn(() => {
        // A minimal FileReader stub: readAsText fires onload on the next microtask,
        // which is what the hook under test awaits.
        const reader: { result: string; onload: (() => void) | null; readAsText?: () => void } = {
          result: '[]',
          onload: null,
        }
        reader.readAsText = () => {
          void Promise.resolve().then(() => reader.onload?.())
        }
        return reader
      })
    )
    mockAddMacro.mockReturnValue({ success: true })
    mockParseMacroImport.mockReturnValue([{ command: '/uno', text: 'Uno', contentType: 'text/plain' }])
    mockMergeImport.mockImplementation((parsed: any[], _existing: any, addFn: (m: any) => any) => {
      parsed.forEach((m) => addFn(m))
      return { added: parsed.length, skipped: 0 }
    })
  })

  it('imports a file: parses, merges, adds, and reports a success status', async () => {
    const { result } = renderHook(() => useMacroImportExport())
    void act(() => {
      result.current.importFromFile(new File(['[]'], 'macros.json', { type: 'application/json' }))
    })

    await waitFor(() => expect(mockParseMacroImport).toHaveBeenCalledWith(expect.any(String)))
    expect(mockMergeImport).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ command: '/uno' })]),
      expect.any(Set),
      expect.any(Function)
    )
    expect(mockAddMacro).toHaveBeenCalled()
    await waitFor(() => expect(result.current.status?.ok).toBe(true))
  })

  it('backs the library up before importing over it, forced past the duplicate check', async () => {
    // An import is one of the two operations most likely to want undoing, and the burst of adds
    // that follows would otherwise be the only thing recorded.
    const { result } = renderHook(() => useMacroImportExport())
    void act(() => {
      result.current.importFromFile(new File(['[]'], 'macros.json', { type: 'application/json' }))
    })

    await waitFor(() => expect(mockTakeSnapshot).toHaveBeenCalledWith([], { force: true }))
    expect(mockTakeSnapshot.mock.invocationCallOrder[0]).toBeLessThan(
      mockAddMacro.mock.invocationCallOrder[0]
    )
  })

  it('does not back up when the file holds nothing worth importing', async () => {
    mockParseMacroImport.mockReturnValueOnce([])
    const { result } = renderHook(() => useMacroImportExport())
    void act(() => {
      result.current.importFromFile(new File(['[]'], 'macros.json', { type: 'application/json' }))
    })

    await waitFor(() => expect(result.current.status?.ok).toBe(false))
    expect(mockTakeSnapshot).not.toHaveBeenCalled()
  })

  it('reports an error status when the file is invalid', async () => {
    mockParseMacroImport.mockImplementation(() => {
      throw new Error('bad json')
    })
    const { result } = renderHook(() => useMacroImportExport())
    void act(() => {
      result.current.importFromFile(new File(['x'], 'x.json'))
    })

    await waitFor(() => {
      expect(result.current.status).toEqual({
        ok: false,
        message: 'settings.importExport.status.invalidFile',
      })
    })
  })
})
