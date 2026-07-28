// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { announce, removeAnnouncer } from './announcer'

const region = () => document.querySelector('[data-component="monky-announcer"]')

describe('announcer', () => {
  afterEach(() => removeAnnouncer())

  it('lives in the host document, not in any shadow root', () => {
    announce('hello')
    // The overlay renders behind a shadow boundary, which an IDREF cannot cross. A live
    // region carries text instead of a reference, but only if it sits where the reader
    // is already looking.
    expect(region()?.parentElement).toBe(document.body)
  })

  it('is a polite, atomic live region', () => {
    announce('hello')
    expect(region()).toHaveAttribute('aria-live', 'polite')
    expect(region()).toHaveAttribute('aria-atomic', 'true')
  })

  it('is offscreen rather than display:none, which would silence it', () => {
    announce('hello')
    const style = (region() as HTMLElement).style
    expect(style.display).not.toBe('none')
    expect(style.visibility).not.toBe('hidden')
    expect(style.position).toBe('fixed')
  })

  it('reuses one region rather than stacking them up', () => {
    announce('one')
    announce('two')
    expect(document.querySelectorAll('[data-component="monky-announcer"]')).toHaveLength(1)
    expect(region()?.textContent).toBe('two')
  })

  it('clears on the empty string, so the next opening re-announces the same row', () => {
    announce('/sig, My signature, 1 of 5')
    announce('')
    expect(region()?.textContent).toBe('')
  })

  it('removes the node on teardown and recreates it on demand', () => {
    announce('hello')
    removeAnnouncer()
    expect(region()).toBeNull()
    announce('again')
    expect(region()?.textContent).toBe('again')
  })
})
