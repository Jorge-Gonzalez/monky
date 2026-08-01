// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deviceId, forgetDeviceId } from './deviceId'

function installStorage(seed: Record<string, unknown> = {}) {
  const area = new Map<string, unknown>(Object.entries(seed))
  const local = {
    get: vi.fn((key: string) => Promise.resolve(area.has(key) ? { [key]: area.get(key) } : {})),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.entries(items).forEach(([k, v]) => area.set(k, v))
      return Promise.resolve()
    }),
  }
  ;(globalThis as unknown as { chrome: unknown }).chrome = { storage: { local } }
  return { area, local }
}

beforeEach(() => {
  forgetDeviceId()
})

describe('deviceId', () => {
  it('mints an id on first use and stores it locally', async () => {
    const store = installStorage()
    const id = await deviceId()
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    expect(store.area.get('device-id')).toBe(id)
  })

  it('returns the same id on a later call', async () => {
    installStorage()
    expect(await deviceId()).toBe(await deviceId())
  })

  it('reads an id minted by an earlier session', async () => {
    installStorage({ 'device-id': 'earlier-session' })
    expect(await deviceId()).toBe('earlier-session')
  })

  it('mints a fresh id rather than trusting a stored value of the wrong shape', async () => {
    const store = installStorage({ 'device-id': 42 })
    const id = await deviceId()
    expect(id).not.toBe(42)
    expect(store.area.get('device-id')).toBe(id)
  })

  it('reads storage once and then answers from memory', async () => {
    // Called on every macro change and on every settings render, so it should not be a storage
    // round trip each time.
    const store = installStorage()
    await deviceId()
    await deviceId()
    await deviceId()
    expect(store.local.get).toHaveBeenCalledTimes(1)
  })

  it('is a per-device id by construction, because local storage does not sync', async () => {
    // Two installs, each with its own local area, get different ids without any coordination --
    // which is the whole reason this needs no API and no fingerprinting.
    installStorage()
    const first = await deviceId()
    forgetDeviceId()
    installStorage()
    expect(await deviceId()).not.toBe(first)
  })
})
