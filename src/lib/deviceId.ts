// A per-device identity, with no API and no fingerprinting.
//
// `chrome.storage.local` does not sync, so a uuid written there is a device id by construction:
// every install that can read this key is, by definition, this device. The browser offers nothing
// better -- `identity.getProfileUserInfo()` returns the same account on every machine, and
// `sessions.getDevices()` reports tab-sync data rather than anything about this extension.

const KEY = 'device-id'

let cached: string | null = null

/** The id for this install, minted on first use. */
export async function deviceId(): Promise<string> {
  if (cached !== null) return cached
  const stored = await chrome.storage.local.get(KEY)
  const existing: unknown = stored[KEY]
  if (typeof existing === 'string' && existing.length > 0) {
    cached = existing
    return existing
  }
  const minted = crypto.randomUUID()
  await chrome.storage.local.set({ [KEY]: minted })
  cached = minted
  return minted
}

/** Only for tests, which need each case to start without the module's memory of the last one. */
export function forgetDeviceId(): void {
  cached = null
}
