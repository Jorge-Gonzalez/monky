// @vitest-environment jsdom
// A timezone that observes DST, set before anything reads a date, because the difference this
// file exists to catch is invisible in UTC. Under UTC, stepping the date back and subtracting
// 24 hours agree exactly, so a test there passes against either and proves nothing.
process.env.TZ = 'Europe/Madrid'

import { describe, it, expect } from 'vitest'
import { snapshotBucket } from './macroSnapshots'

describe('snapshotBucket across a clock change', () => {
  it('still calls the previous day yesterday when that day was 23 hours long', () => {
    // Spain moves to summer time at 02:00 on 29 March 2026, so the 29th is 23 hours long.
    // Midnight on the 30th minus 24 hours lands at 23:00 on the 28th -- an hour short of the
    // start of the 29th -- so a subtraction would decide the 29th was not yesterday and label a
    // one-day-old backup with a bare date instead.
    const now = new Date(2026, 2, 30, 12, 0, 0).getTime()
    const duringYesterday = new Date(2026, 2, 29, 12, 0, 0).toISOString()
    expect(snapshotBucket(duringYesterday, now)).toBe('yesterday')
  })

  it('and the same going the other way, when the day was 25 hours long', () => {
    // Back to winter time at 03:00 on 25 October 2026, making the 25th 25 hours long.
    const now = new Date(2026, 9, 26, 12, 0, 0).getTime()
    const duringYesterday = new Date(2026, 9, 25, 12, 0, 0).toISOString()
    expect(snapshotBucket(duringYesterday, now)).toBe('yesterday')
  })

  it('confirms the timezone is actually in effect, or the two tests above mean nothing', () => {
    // Guard against a runner that ignores process.env.TZ: without a real offset change these
    // cases collapse back into the UTC one they were written to escape.
    const winter = new Date(2026, 0, 15).getTimezoneOffset()
    const summer = new Date(2026, 6, 15).getTimezoneOffset()
    expect(winter).not.toBe(summer)
  })
})
