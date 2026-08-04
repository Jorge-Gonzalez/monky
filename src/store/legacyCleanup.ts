// Keys left behind by features that no longer exist.
//
// They are not all the same kind of leftover, and the difference decides what happens to them.
//
// `access` and `refresh` held bearer tokens for the hosted backend, which was removed. Credential
// material has no defensible reason to sit in extension storage after the thing it authenticated
// against is gone -- expired or not, it is a secret retained by accident. Removing it costs nothing,
// and keeping it is a choice rather than neutrality.
//
// `macros` and `pendingOps` are different: both can hold macro *content*. `macros` is a pre-2026
// storage key and `pendingOps` queued creates that never reached the network, so between them they
// may be the only surviving copy of something. Deleting those is a data deletion and should be a
// decision someone makes, not a side effect of an upgrade -- so they are deliberately left alone,
// and ADR 0001 records why. One policy was previously applied to all four keys; only two of them
// ever deserved it.

/** Tokens for a backend that no longer exists. Nothing reads them; nothing should keep them. */
const CREDENTIAL_KEYS = ['access', 'refresh'] as const

/**
 * Remove obsolete credential material.
 *
 * Reads before writing, so an ordinary startup costs one `get` and no write. `remove` on absent keys
 * would be harmless, but running it unconditionally would mean a storage write on every
 * service-worker wake for a condition true exactly once in an install's life.
 */
export async function removeObsoleteCredentials(): Promise<void> {
  const stored = await chrome.storage.local.get([...CREDENTIAL_KEYS])
  const present = CREDENTIAL_KEYS.filter((key) => stored[key] !== undefined)
  if (present.length === 0) return
  await chrome.storage.local.remove([...present])
  console.info(
    `[MONKY] removed leftover credentials for the withdrawn backend: ${present.join(', ')}. ` +
      'Macro content under "macros" and "pendingOps" is deliberately left in place.'
  )
}
