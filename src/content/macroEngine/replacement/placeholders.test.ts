import { describe, it, expect } from 'vitest'
import { parsePlaceholders, stripPlaceholders, hasPlaceholders } from './placeholders'

describe('parsePlaceholders', () => {
  it('returns empty array when no placeholders present', () => {
    expect(parsePlaceholders('Hello world')).toEqual([])
  })

  it('finds a single placeholder with correct label and positions', () => {
    const result = parsePlaceholders('Dear {{name}}, thanks')
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('name')
    expect(result[0].start).toBe(5)
    expect(result[0].end).toBe(13)
  })

  it('finds multiple placeholders in order', () => {
    const result = parsePlaceholders('{{greeting}} {{name}}')
    expect(result).toHaveLength(2)
    expect(result[0].label).toBe('greeting')
    expect(result[1].label).toBe('name')
  })

  it('returns correct start/end for each placeholder in multi-placeholder text', () => {
    const text = 'Hello {{first}} and {{second}} end'
    const result = parsePlaceholders(text)
    expect(text.slice(result[0].start, result[0].end)).toBe('{{first}}')
    expect(text.slice(result[1].start, result[1].end)).toBe('{{second}}')
  })

  it('handles placeholder at the start of text', () => {
    const result = parsePlaceholders('{{label}} rest')
    expect(result[0].start).toBe(0)
    expect(result[0].end).toBe(9)
  })

  it('handles placeholder at the end of text', () => {
    const text = 'prefix {{label}}'
    const result = parsePlaceholders(text)
    expect(result[0].end).toBe(text.length)
  })

  it('ignores malformed syntax without closing braces', () => {
    expect(parsePlaceholders('Hello {{unclosed')).toEqual([])
  })
})

describe('stripPlaceholders', () => {
  it('returns text unchanged when no placeholders present', () => {
    expect(stripPlaceholders('Hello world')).toBe('Hello world')
  })

  it('replaces {{label}} with just the label text', () => {
    expect(stripPlaceholders('Dear {{name}}, thanks')).toBe('Dear name, thanks')
  })

  it('strips all placeholders in a multi-placeholder string', () => {
    expect(stripPlaceholders('{{greeting}} {{name}}, order {{id}} ready'))
      .toBe('greeting name, order id ready')
  })
})

describe('hasPlaceholders', () => {
  it('returns false for plain text', () => {
    expect(hasPlaceholders('Hello world')).toBe(false)
  })

  it('returns true when a placeholder is present', () => {
    expect(hasPlaceholders('Dear {{name}}')).toBe(true)
  })

  it('returns false for malformed syntax without closing braces', () => {
    expect(hasPlaceholders('Hello {{unclosed')).toBe(false)
  })
})
