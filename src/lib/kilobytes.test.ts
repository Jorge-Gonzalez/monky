import { describe, it, expect } from 'vitest'
import { kilobytes } from './kilobytes'

describe('kilobytes', () => {
  it('separates two stores that a whole number would have shown as identical', () => {
    // The case this exists for: 6,460 and 6,878 bytes both rounded to "6" and "7" respectively,
    // which read as a kilobyte apart when they are 418 bytes apart.
    expect(kilobytes(6460, 'en')).toBe('6.3')
    expect(kilobytes(6878, 'en')).toBe('6.7')
  })

  it('drops the decimal once it stops meaning anything', () => {
    expect(kilobytes(102_400, 'en')).toBe('100')
    expect(kilobytes(45_000, 'en')).toBe('44')
  })

  it('keeps one decimal right up to the threshold, and none at it', () => {
    expect(kilobytes(10_239, 'en')).toBe('10.0')
    expect(kilobytes(10_240, 'en')).toBe('10')
  })

  it('writes the separator the way the reader’s language does', () => {
    // Not cosmetic: "6.3" read as Spanish is a different number from the one meant.
    expect(kilobytes(6460, 'es')).toBe('6,3')
  })

  it('says something sensible about an empty store', () => {
    expect(kilobytes(0, 'en')).toBe('0.0')
  })
})
