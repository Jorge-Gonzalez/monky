// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockRenderer = {
  render: vi.fn(),
  initialize: vi.fn(),
  clear: vi.fn(),
  destroy: vi.fn(),
  getShadowRoot: vi.fn(),
}
const mockStyleInjector = { inject: vi.fn(), remove: vi.fn() }

vi.mock('../services/reactRenderer', () => ({ createReactRenderer: () => mockRenderer }))
vi.mock('../services/styleInjector', () => ({ createStyleInjector: () => mockStyleInjector }))
vi.mock('../../macroEngine/replacement/editableUtils', () => ({ getActiveEditable: vi.fn(() => null) }))
vi.mock('../suggestionsOverlay/utils/caretPosition', () => ({ getCaretCoordinates: vi.fn(() => null) }))
vi.mock('../suggestionsOverlay/utils/popupPositioning', () => ({
  calculateOptimalPosition: () => ({ x: 10, y: 20, placement: 'bottom' as const }),
}))
// We test the manager, not the popup UI (covered separately).
vi.mock('./DeleteConfirmPopup', () => ({ DeleteConfirmPopup: () => null }))

import { createDeleteConfirmManager } from './DeleteConfirmManager'

const macro = { id: '1', command: '/note', text: 'Notes', contentType: 'text/plain' as const }

describe('createDeleteConfirmManager', () => {
  let host: HTMLElement
  let mgr: ReturnType<typeof createDeleteConfirmManager>

  beforeEach(() => {
    vi.clearAllMocks()
    host = document.createElement('div')
    document.body.appendChild(host)
    mockRenderer.getShadowRoot.mockReturnValue({ host } as any)
    mgr = createDeleteConfirmManager()
  })

  afterEach(() => mgr.destroy()) // removes the document listener between tests

  it('show renders the popup and marks the manager visible', () => {
    mgr.show(macro)
    expect(mgr.isVisible()).toBe(true)
    expect(mockRenderer.render).toHaveBeenCalled()
  })

  it('dismisses on a mousedown outside the popup', () => {
    mgr.show(macro)
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(mgr.isVisible()).toBe(false)
    expect(mockRenderer.clear).toHaveBeenCalled()
  })

  it('keeps the popup open on a mousedown within it', () => {
    mgr.show(macro)
    host.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(mgr.isVisible()).toBe(true)
  })

  it('confirming runs the registered callback with the macro, then hides', () => {
    const onConfirm = vi.fn()
    mgr.setOnConfirm(onConfirm)
    mgr.show(macro)
    const props = (mockRenderer.render.mock.calls.at(-1)![0] as any).props
    props.onConfirm()
    expect(onConfirm).toHaveBeenCalledWith(macro)
    expect(mgr.isVisible()).toBe(false)
  })

  it('stops listening for outside clicks once hidden', () => {
    mgr.show(macro)
    mgr.hide()
    mockRenderer.clear.mockClear()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(mockRenderer.clear).not.toHaveBeenCalled()
  })
})
