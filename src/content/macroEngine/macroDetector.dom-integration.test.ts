// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * macroDetector coordinator-routing test (DOM backend).
 *
 * The gdocs-integration test exercises the commit/reconstruction tail; this one
 * covers the onKeyDown ROUTING — which key delegates to which action — plus
 * handleMacroSelectedFromSearchOverlay. A real <textarea> drives real keydowns;
 * detector-core, keyUtils, editableUtils and the DOM backend stay REAL. Only the
 * config store and the Google Docs adapter (kept inert: not a Docs page) are mocked.
 */

const isGoogleDocs = vi.fn(() => false)
const isIntentionalFocusMove = vi.fn(() => false)
vi.mock('./googledocs/googleDocsAdapter', () => ({
  isGoogleDocs: () => isGoogleDocs(),
  isGoogleDocsIframeElement: () => false,
  attachToGoogleDocsIframe: () => () => {},
  isIntentionalFocusMove: () => isIntentionalFocusMove(),
  focusGoogleDocsEditor: () => {},
  replaceInGoogleDocs: () => {},
}))

vi.mock('../../store/useMacroStore', () => ({
  useMacroStore: { getState: vi.fn(), subscribe: vi.fn() },
}))

import type { MacroDetector } from './macroDetector'
import { createMacroDetector } from './macroDetector'
import { useMacroStore } from '../../store/useMacroStore'
import type { DetectorActions } from '../actions/detectorActions'
import type { Macro } from '../../types'

const sigMacro: Macro = { id: 1, command: '/sig', text: 'Signature', contentType: 'text/plain' }

let detector: MacroDetector
let actions: DetectorActions
let textarea: HTMLTextAreaElement

function setup(config: Partial<{ useCommitKeys: boolean; disabledSites: string[] }> = {}) {
  ;(useMacroStore.getState as any).mockReturnValue({
    config: { useCommitKeys: false, prefixes: ['/'], disabledSites: [], ...config },
  })
  textarea = document.createElement('textarea')
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.setSelectionRange(0, 0)

  actions = {
    onDetectionStarted: vi.fn(),
    onDetectionUpdated: vi.fn(),
    onDetectionCancelled: vi.fn(),
    onCommitRequested: vi.fn().mockReturnValue(true),
    onCancelRequested: vi.fn(),
    onNavigationRequested: vi.fn(),
    onMacroCommitted: vi.fn(),
    onShowAllRequested: vi.fn(),
  } as unknown as DetectorActions
  detector = createMacroDetector(actions)
  detector.initialize()
  detector.setMacros([sigMacro])
}

function key(k: string, opts: KeyboardEventInit = {}) {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts })
  textarea.dispatchEvent(e)
  return e
}

afterEach(() => {
  detector.destroy()
  textarea.remove()
  vi.clearAllMocks()
})

describe('macroDetector — coordinator routing (DOM)', () => {
  it('starts detection when a prefix character is typed', () => {
    setup()
    key('/')
    expect(actions.onDetectionStarted).toHaveBeenCalledWith('/', expect.anything())
  })

  it('Escape asks to cancel and tears down the active detection', () => {
    setup()
    key('/')
    key('Escape')
    expect(actions.onCancelRequested).toHaveBeenCalledTimes(1)
    expect(actions.onDetectionCancelled).toHaveBeenCalledTimes(1)
  })

  it('arrow keys delegate to navigation while detecting', () => {
    setup()
    ;(actions.onNavigationRequested as any).mockReturnValue(true)
    key('/')
    const e = key('ArrowRight')
    expect(actions.onNavigationRequested).toHaveBeenCalledWith('right')
    expect(e.defaultPrevented).toBe(true)
  })

  it('Tab requests the show-all overlay for the current buffer', () => {
    setup()
    key('/')
    const e = key('Tab')
    expect(actions.onShowAllRequested).toHaveBeenCalledWith('/', expect.anything())
    expect(e.defaultPrevented).toBe(true)
  })

  it('does not detect at all on a disabled site', () => {
    setup({ disabledSites: [window.location.hostname] })
    key('/')
    expect(actions.onDetectionStarted).not.toHaveBeenCalled()
  })

  it('manual mode routes a commit key to onCommitRequested', () => {
    setup({ useCommitKeys: true })
    for (const c of '/sig') key(c)
    key(' ')
    expect(actions.onCommitRequested).toHaveBeenCalledWith('/sig')
  })

  it('a blur cancels the detection after the grace delay', () => {
    vi.useFakeTimers()
    setup()
    key('/')
    window.dispatchEvent(new Event('blur'))
    vi.advanceTimersByTime(100)
    expect(actions.onDetectionCancelled).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

describe('macroDetector — handleMacroSelectedFromSearchOverlay', () => {
  it('inserts the macro at the cursor and reports the commit', () => {
    setup()
    textarea.value = 'hello '
    textarea.setSelectionRange(6, 6)

    detector.handleMacroSelectedFromSearchOverlay(sigMacro, textarea)

    expect(textarea.value).toBe('hello Signature')
    expect(actions.onMacroCommitted).toHaveBeenCalledWith('1')
  })

  it('does nothing when there is no target element', () => {
    setup()
    detector.handleMacroSelectedFromSearchOverlay(sigMacro, null)
    expect(actions.onMacroCommitted).not.toHaveBeenCalled()
  })
})
