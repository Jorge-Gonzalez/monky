import { describe, it, expect, vi, beforeEach } from 'vitest'

// Boundaries: the store is the source of truth (write + dup-check), lib/errors formats a raw store
// error into a friendly string. Both are mocked and macroCrud's own responsibilities are asserted:
// stamp metadata, delegate, and report the outcome.
//
// These tests used to centre on a second invariant -- push to the backend ONLY when the local write
// succeeded -- which went away with the backend. What survives is the half that was always local:
// a rejected write must produce a formatted error and change nothing.

const addMacro = vi.fn()
const updateMacroInStore = vi.fn()
const deleteMacrosInStore = vi.fn()

const currentMacros = [{ id: '42', command: '/keep', text: 'still here' }]
const currentConfig = { prefixes: ['/'], language: 'en' }
vi.mock('./useMacroStore', () => ({
  useMacroStore: {
    getState: () => ({
      macros: currentMacros,
      config: currentConfig,
      addMacro,
      updateMacro: updateMacroInStore,
      deleteMacros: deleteMacrosInStore,
    }),
  },
}))

const keepPrevious = vi.fn<(macros: unknown, reason: unknown) => Promise<null>>(() => Promise.resolve(null))
vi.mock('./macroPrevious', () => ({
  keepPrevious: (macros: unknown, reason: unknown) => keepPrevious(macros, reason),
}))

// Format raw store error → friendly string. Its own mapping is covered in
// errors.test.ts; here we only assert macroCrud threads the right args through.
vi.mock('../lib/errors', () => ({
  getErrorMessage: (error: string, command: string) => `friendly(${error}|${command})`,
}))

import { createMacro, updateMacro, deleteMacros } from './macroCrud'

const DUP = 'El comando "/sig" ya existe.'

beforeEach(() => {
  vi.clearAllMocks()
  addMacro.mockReturnValue({ success: true })
  updateMacroInStore.mockReturnValue({ success: true })
})

describe('createMacro', () => {
  it('stamps an id and updated_at, then writes to the store', () => {
    const result = createMacro({ command: '/sig', text: 'Signature', contentType: 'text/plain' })

    expect(addMacro).toHaveBeenCalledTimes(1)
    const stamped = addMacro.mock.calls[0][0]
    expect(stamped).toMatchObject({ command: '/sig', text: 'Signature' })
    expect(stamped.id).toEqual(expect.any(String))
    // Outlived the backend that ordered merges by it: "when was this last changed" is worth
    // knowing regardless, and the restore UI is the next thing that wants it.
    expect(stamped.updated_at).toEqual(expect.any(String))
    expect(result).toEqual({ success: true })
  })

  it('reports a rejected write as a formatted error, having written nothing', () => {
    addMacro.mockReturnValue({ success: false, error: DUP })

    const result = createMacro({ command: '/sig', text: 'Signature', contentType: 'text/plain' })

    // Raw store error is threaded through the formatter with the macro's command.
    expect(result).toEqual({ success: false, error: `friendly(${DUP}|/sig)` })
  })

  it('never repeats an id, even for macros created in the same millisecond', () => {
    // `Date.now().toString()` handed both of these the same id. Nothing complained at the time --
    // addMacro guards duplicate commands, not duplicate ids -- and validateLibrary rejects
    // duplicate ids as malformed, so the result was a library the app would write happily and then
    // refuse to restore. Time is frozen here because that is the case, not an unlucky one.
    const original = [...currentMacros]
    vi.useFakeTimers()
    try {
      addMacro.mockImplementation((macro: { id: string }) => {
        currentMacros.push(macro as (typeof currentMacros)[number])
        return { success: true }
      })
      createMacro({ command: '/one', text: 'a', contentType: 'text/plain' })
      createMacro({ command: '/two', text: 'b', contentType: 'text/plain' })

      const ids = currentMacros.map((macro) => String(macro.id))
      expect(ids).toHaveLength(original.length + 2)
      expect(new Set(ids).size).toBe(ids.length)
    } finally {
      vi.useRealTimers()
      currentMacros.length = 0
      currentMacros.push(...original)
    }
  })
})

describe('updateMacro', () => {
  it('stamps updated_at and patches the store', () => {
    const result = updateMacro('42', { text: 'Updated' })

    expect(updateMacroInStore).toHaveBeenCalledTimes(1)
    const [id, patch] = updateMacroInStore.mock.calls[0]
    expect(id).toBe('42')
    expect(patch).toMatchObject({ text: 'Updated' })
    expect(patch.updated_at).toEqual(expect.any(String))
    expect(result).toEqual({ success: true })
  })

  it('formats a rejected update against the incoming command', () => {
    updateMacroInStore.mockReturnValue({ success: false, error: DUP })

    const result = updateMacro('42', { command: '/sig' })

    expect(result).toEqual({ success: false, error: `friendly(${DUP}|/sig)` })
  })

  it('formats the error against an empty command when the patch carries none', () => {
    updateMacroInStore.mockReturnValue({ success: false, error: DUP })

    const result = updateMacro('42', { text: 'no command here' })

    expect(result).toEqual({ success: false, error: `friendly(${DUP}|)` })
  })
})

describe('deleteMacros', () => {
  it('keeps the library before deleting, and says why', () => {
    // The operation whole-library recovery exists for: a selection deleted by accident, typically
    // discovered when a macro fails to expand weeks later.
    deleteMacros(['42'])
    expect(keepPrevious).toHaveBeenCalledWith({ macros: currentMacros, config: currentConfig }, 'delete')
  })

  it('captures the library as it was, not as the delete leaves it', () => {
    deleteMacros(['42'])
    const [kept] = keepPrevious.mock.calls[0]
    expect((kept as { macros: unknown }).macros).toBe(currentMacros)
  })

  it('keeps nothing when the selection is empty', () => {
    deleteMacros([])
    expect(keepPrevious).not.toHaveBeenCalled()
  })

  it('deletes from the store and reports success', () => {
    const result = deleteMacros(['42'])

    expect(deleteMacrosInStore).toHaveBeenCalledWith(['42'])
    expect(result).toEqual({ success: true })
  })

  it('writes a whole selection to the store in one pass', () => {
    // One local write is the point of the array: several would leave renders showing the
    // list part-way through a delete the user asked for as a single action.
    deleteMacros(['1', '2', '3'])

    expect(deleteMacrosInStore).toHaveBeenCalledTimes(1)
    expect(deleteMacrosInStore).toHaveBeenCalledWith(['1', '2', '3'])
  })

  it('does nothing at all when the selection is empty', () => {
    const result = deleteMacros([])

    expect(deleteMacrosInStore).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })
})
