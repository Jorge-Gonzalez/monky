import { describe, it, expect, vi, beforeEach } from 'vitest'

// Boundaries: the store is the local source of truth (write + dup-check), lib/sync
// is the backend push, lib/errors formats a raw store error into a friendly string.
// We mock all three and assert macroCrud's own responsibilities: stamp metadata,
// delegate, and — the load-bearing invariant — push to the backend ONLY when the
// local write succeeded.

const addMacro = vi.fn()
const updateMacroInStore = vi.fn()
const deleteMacroInStore = vi.fn()

vi.mock('./useMacroStore', () => ({
  useMacroStore: {
    getState: () => ({
      addMacro,
      updateMacro: updateMacroInStore,
      deleteMacro: deleteMacroInStore,
    }),
  },
}))

const pushCreate = vi.fn()
const pushUpdate = vi.fn()
const pushDelete = vi.fn()

vi.mock('../lib/sync', () => ({
  pushCreate: (m: any) => pushCreate(m),
  pushUpdate: (m: any) => pushUpdate(m),
  pushDelete: (id: any) => pushDelete(id),
}))

// Format raw store error → friendly string. Its own mapping is covered in
// errors.test.ts; here we only assert macroCrud threads the right args through.
vi.mock('../lib/errors', () => ({
  getErrorMessage: (error: string, command: string) => `friendly(${error}|${command})`,
}))

import { createMacro, updateMacro, deleteMacro } from './macroCrud'

const DUP = 'El comando "/sig" ya existe.'

beforeEach(() => {
  vi.clearAllMocks()
  addMacro.mockReturnValue({ success: true })
  updateMacroInStore.mockReturnValue({ success: true })
})

describe('createMacro', () => {
  it('stamps an id and updated_at, writes to the store, then pushes that macro to sync', async () => {
    const result = await createMacro({ command: '/sig', text: 'Signature', contentType: 'text/plain' })

    expect(addMacro).toHaveBeenCalledTimes(1)
    const stamped = addMacro.mock.calls[0][0]
    expect(stamped).toMatchObject({ command: '/sig', text: 'Signature' })
    expect(stamped.id).toEqual(expect.any(String))
    expect(stamped.updated_at).toEqual(expect.any(String))

    // The exact macro the store accepted is the one pushed to the backend.
    expect(pushCreate).toHaveBeenCalledWith(stamped)
    expect(result).toEqual({ success: true })
  })

  it('does NOT push to the backend when the local write is rejected (duplicate)', async () => {
    addMacro.mockReturnValue({ success: false, error: DUP })

    const result = await createMacro({ command: '/sig', text: 'Signature', contentType: 'text/plain' })

    expect(pushCreate).not.toHaveBeenCalled()
    // Raw store error is threaded through the formatter with the macro's command.
    expect(result).toEqual({ success: false, error: `friendly(${DUP}|/sig)` })
  })
})

describe('updateMacro', () => {
  it('stamps updated_at, patches the store, then pushes the patch with its id', async () => {
    const result = await updateMacro('42', { text: 'Updated' })

    expect(updateMacroInStore).toHaveBeenCalledTimes(1)
    const [id, patch] = updateMacroInStore.mock.calls[0]
    expect(id).toBe('42')
    expect(patch).toMatchObject({ text: 'Updated' })
    expect(patch.updated_at).toEqual(expect.any(String))

    expect(pushUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: '42', text: 'Updated' }))
    expect(result).toEqual({ success: true })
  })

  it('does NOT push when the update is rejected; formats the error against the incoming command', async () => {
    updateMacroInStore.mockReturnValue({ success: false, error: DUP })

    const result = await updateMacro('42', { command: '/sig' })

    expect(pushUpdate).not.toHaveBeenCalled()
    expect(result).toEqual({ success: false, error: `friendly(${DUP}|/sig)` })
  })

  it('formats the error against an empty command when the patch carries none', async () => {
    updateMacroInStore.mockReturnValue({ success: false, error: DUP })

    const result = await updateMacro('42', { text: 'no command here' })

    expect(result).toEqual({ success: false, error: `friendly(${DUP}|)` })
  })
})

describe('deleteMacro', () => {
  it('deletes from the store, pushes the delete by id, and reports success', async () => {
    const result = await deleteMacro('42')

    expect(deleteMacroInStore).toHaveBeenCalledWith('42')
    expect(pushDelete).toHaveBeenCalledWith('42')
    expect(result).toEqual({ success: true })
  })
})
