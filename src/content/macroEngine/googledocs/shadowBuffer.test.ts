import { describe, it, expect } from 'vitest'
import { createShadowBuffer } from './shadowBuffer'

describe('createShadowBuffer', () => {
  it('starts empty', () => {
    const sb = createShadowBuffer()
    expect(sb.read()).toBe('')
    expect(sb.length).toBe(0)
  })

  it('handlePrintable appends regular characters', () => {
    const sb = createShadowBuffer()
    sb.handlePrintable(':')
    sb.handlePrintable('f')
    sb.handlePrintable('o')
    sb.handlePrintable('o')
    expect(sb.read()).toBe(':foo')
    expect(sb.length).toBe(4)
  })

  it('handlePrintable resets on space', () => {
    const sb = createShadowBuffer()
    sb.handlePrintable(':')
    sb.handlePrintable('f')
    sb.handlePrintable(' ')
    expect(sb.read()).toBe('')
    expect(sb.length).toBe(0)
  })

  it('handlePrintable resets on tab', () => {
    const sb = createShadowBuffer()
    sb.handlePrintable(':')
    sb.handlePrintable('f')
    sb.handlePrintable('\t')
    expect(sb.read()).toBe('')
  })

  it('backspace removes the last character', () => {
    const sb = createShadowBuffer()
    sb.handlePrintable(':')
    sb.handlePrintable('f')
    sb.handlePrintable('o')
    sb.handlePrintable('x')  // typo
    sb.backspace()
    expect(sb.read()).toBe(':fo')
    expect(sb.length).toBe(3)
  })

  it('backspace on empty buffer is a no-op', () => {
    const sb = createShadowBuffer()
    expect(() => sb.backspace()).not.toThrow()
    expect(sb.read()).toBe('')
  })

  it('reset clears the buffer', () => {
    const sb = createShadowBuffer()
    sb.handlePrintable(':')
    sb.handlePrintable('f')
    sb.reset()
    expect(sb.read()).toBe('')
    expect(sb.length).toBe(0)
  })

  it('round-trip: type, backspace typo, retype — buffer matches as if typed correctly', () => {
    const sb = createShadowBuffer()
    sb.handlePrintable(':')
    sb.handlePrintable('f')
    sb.handlePrintable('o')
    sb.handlePrintable('x')  // typo
    sb.backspace()            // correction
    sb.handlePrintable('o')  // retype
    expect(sb.read()).toBe(':foo')
  })

  it('reset after word boundary allows fresh accumulation', () => {
    const sb = createShadowBuffer()
    sb.handlePrintable(':')
    sb.handlePrintable('f')
    sb.handlePrintable(' ')  // word boundary → reset
    sb.handlePrintable(':')
    sb.handlePrintable('b')
    sb.handlePrintable('a')
    sb.handlePrintable('r')
    expect(sb.read()).toBe(':bar')
  })

  it('read() after backspace to empty returns empty string', () => {
    const sb = createShadowBuffer()
    sb.handlePrintable('a')
    sb.backspace()
    expect(sb.read()).toBe('')
    expect(sb.length).toBe(0)
  })
})
