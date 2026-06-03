import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  SYSTEM_MACROS,
  isSystemMacro,
  isParametricSystemMacro,
  parseParametricBuffer,
  handleSystemMacro,
  handleParametricSystemCommand,
} from './systemMacros'
import { modalCoordinator } from '../overlays'
import { useMacroStore } from '../../store/useMacroStore'

vi.mock('../overlays', () => ({
  modalCoordinator: {
    show: vi.fn(),
    navigateToEditor: vi.fn(),
    hide: vi.fn(),
  },
}))

vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: {
    getState: vi.fn(),
    subscribe: vi.fn(),
  },
}))

const PREFIXES = ['/']

const notaMacro = { id: '1', command: '/nota', text: 'Hello nota', contentType: 'text/plain' as const }
const sigMacro  = { id: '2', command: '/sig',  text: 'Jorge',      contentType: 'text/plain' as const }
const mockDeleteMacro = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(useMacroStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
    macros: [notaMacro, sigMacro],
    deleteMacro: mockDeleteMacro,
  })
})

// ─── SYSTEM_MACROS ────────────────────────────────────────────────────────────

describe('SYSTEM_MACROS', () => {
  it('contains :new, :edit, :delete, :settings, /?', () => {
    const commands = SYSTEM_MACROS.map(m => m.command)
    expect(commands).toContain(':new')
    expect(commands).toContain(':edit')
    expect(commands).toContain(':delete')
    expect(commands).toContain(':settings')
    expect(commands).toContain('/?')
  })

  it(':edit and :delete are parametric', () => {
    expect(SYSTEM_MACROS.find(m => m.command === ':edit')?.isParametric).toBe(true)
    expect(SYSTEM_MACROS.find(m => m.command === ':delete')?.isParametric).toBe(true)
  })

  it(':new, :settings and /? are not parametric', () => {
    for (const cmd of [':new', ':settings', '/?']) {
      expect(SYSTEM_MACROS.find(m => m.command === cmd)?.isParametric).toBeFalsy()
    }
  })

  it('all entries have isSystemMacro: true and empty text', () => {
    for (const m of SYSTEM_MACROS) {
      expect(m.isSystemMacro).toBe(true)
      expect(m.text).toBe('')
    }
  })
})

// ─── isSystemMacro ────────────────────────────────────────────────────────────

describe('isSystemMacro', () => {
  it('returns true for every entry in SYSTEM_MACROS', () => {
    for (const m of SYSTEM_MACROS) {
      expect(isSystemMacro(m)).toBe(true)
    }
  })

  it('returns false for a user macro', () => {
    expect(isSystemMacro(notaMacro)).toBe(false)
  })
})

// ─── isParametricSystemMacro ──────────────────────────────────────────────────

describe('isParametricSystemMacro', () => {
  it('returns true for :edit and :delete', () => {
    expect(isParametricSystemMacro(SYSTEM_MACROS.find(m => m.command === ':edit')!)).toBe(true)
    expect(isParametricSystemMacro(SYSTEM_MACROS.find(m => m.command === ':delete')!)).toBe(true)
  })

  it('returns false for non-parametric system macros', () => {
    for (const cmd of [':new', ':settings', '/?']) {
      expect(isParametricSystemMacro(SYSTEM_MACROS.find(m => m.command === cmd)!)).toBe(false)
    }
  })
})

// ─── parseParametricBuffer ────────────────────────────────────────────────────

describe('parseParametricBuffer', () => {
  it('returns null for empty buffer', () => {
    expect(parseParametricBuffer('', PREFIXES)).toBeNull()
  })

  it('returns null for :new (non-parametric command)', () => {
    expect(parseParametricBuffer(':new', PREFIXES)).toBeNull()
  })

  it('returns null for :edit without any param', () => {
    expect(parseParametricBuffer(':edit', PREFIXES)).toBeNull()
  })

  it('returns null for :editx (non-prefix char after command)', () => {
    expect(parseParametricBuffer(':editx', PREFIXES)).toBeNull()
  })

  it('returns result for :edit/nota', () => {
    const result = parseParametricBuffer(':edit/nota', PREFIXES)
    expect(result).not.toBeNull()
    expect(result?.systemMacro.command).toBe(':edit')
    expect(result?.param).toBe('/nota')
  })

  it('returns result for :delete/nota', () => {
    const result = parseParametricBuffer(':delete/nota', PREFIXES)
    expect(result).not.toBeNull()
    expect(result?.systemMacro.command).toBe(':delete')
    expect(result?.param).toBe('/nota')
  })

  it('returns result for partial param :edit/no', () => {
    const result = parseParametricBuffer(':edit/no', PREFIXES)
    expect(result).not.toBeNull()
    expect(result?.param).toBe('/no')
  })

  it('works with semicolon prefix', () => {
    const result = parseParametricBuffer(':edit;cmd', [';'])
    expect(result).not.toBeNull()
    expect(result?.param).toBe(';cmd')
  })
})

// ─── handleSystemMacro ────────────────────────────────────────────────────────

describe('handleSystemMacro', () => {
  it('opens editor for :new', () => {
    handleSystemMacro(SYSTEM_MACROS.find(m => m.command === ':new')!)
    expect(modalCoordinator.show).toHaveBeenCalledWith('editor')
    expect(modalCoordinator.navigateToEditor).toHaveBeenCalledWith(undefined)
  })

  it('opens settings for :settings', () => {
    handleSystemMacro(SYSTEM_MACROS.find(m => m.command === ':settings')!)
    expect(modalCoordinator.show).toHaveBeenCalledWith('settings')
  })

  it('opens search overlay for /?', () => {
    handleSystemMacro(SYSTEM_MACROS.find(m => m.command === '/?')!)
    expect(modalCoordinator.show).toHaveBeenCalledWith('search')
  })

  it('returns false and does nothing for :edit (parametric — needs a param)', () => {
    const result = handleSystemMacro(SYSTEM_MACROS.find(m => m.command === ':edit')!)
    expect(result).toBe(false)
    expect(modalCoordinator.show).not.toHaveBeenCalled()
  })

  it('returns false and does nothing for :delete (parametric — needs a param)', () => {
    const result = handleSystemMacro(SYSTEM_MACROS.find(m => m.command === ':delete')!)
    expect(result).toBe(false)
    expect(modalCoordinator.show).not.toHaveBeenCalled()
  })

  it('returns false for a non-system macro', () => {
    expect(handleSystemMacro(notaMacro)).toBe(false)
    expect(modalCoordinator.show).not.toHaveBeenCalled()
  })
  it('navigates before showing for :new (so the editor mounts once, preserving focus)', () => {
    handleSystemMacro(SYSTEM_MACROS.find(m => m.command === ':new')!)
    const navOrder = (modalCoordinator.navigateToEditor as any).mock.invocationCallOrder[0]
    const showOrder = (modalCoordinator.show as any).mock.invocationCallOrder[0]
    expect(navOrder).toBeLessThan(showOrder)
  })
})

// ─── handleParametricSystemCommand ───────────────────────────────────────────

describe('handleParametricSystemCommand — :edit', () => {
  it('navigates to editor when the param matches a known macro', () => {
    handleParametricSystemCommand('system-edit-macro', '/nota')
    expect(modalCoordinator.show).toHaveBeenCalledWith('editor')
    expect(modalCoordinator.navigateToEditor).toHaveBeenCalledWith(notaMacro)
  })

  it('does nothing when the param matches no macro', () => {
    handleParametricSystemCommand('system-edit-macro', '/unknown')
    expect(modalCoordinator.show).not.toHaveBeenCalled()
    expect(modalCoordinator.navigateToEditor).not.toHaveBeenCalled()
  })

  it('returns true regardless of whether a target was found', () => {
    expect(handleParametricSystemCommand('system-edit-macro', '/nota')).toBe(true)
    expect(handleParametricSystemCommand('system-edit-macro', '/unknown')).toBe(true)
  })

  it('navigates before showing for :edit (mounts once, preserving focus)', () => {
    handleParametricSystemCommand('system-edit-macro', '/nota')
    const navOrder = (modalCoordinator.navigateToEditor as any).mock.invocationCallOrder[0]
    const showOrder = (modalCoordinator.show as any).mock.invocationCallOrder[0]
    expect(navOrder).toBeLessThan(showOrder)
  })
})

describe('handleParametricSystemCommand — :delete', () => {
  it('calls deleteMacro when the param matches a known macro', () => {
    handleParametricSystemCommand('system-delete-macro', '/nota')
    expect(mockDeleteMacro).toHaveBeenCalledWith(notaMacro.id)
  })

  it('does nothing when the param matches no macro', () => {
    handleParametricSystemCommand('system-delete-macro', '/unknown')
    expect(mockDeleteMacro).not.toHaveBeenCalled()
  })

  it('returns true regardless of whether a target was found', () => {
    expect(handleParametricSystemCommand('system-delete-macro', '/nota')).toBe(true)
    expect(handleParametricSystemCommand('system-delete-macro', '/unknown')).toBe(true)
  })
})

describe('handleParametricSystemCommand — unknown id', () => {
  it('returns false for an unrecognized command id', () => {
    expect(handleParametricSystemCommand('system-unknown', '/nota')).toBe(false)
  })
})
