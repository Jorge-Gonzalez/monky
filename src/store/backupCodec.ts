// How the browser-account backup is encoded on the way in and out.
//
// Separate from syncBackup because it is the one part with no opinion about storage: text in, text
// out, and a round trip that has to be exact. That makes it testable on its own, which matters
// disproportionately here -- a codec that is subtly lossy produces a backup that restores *almost*
// what was saved, and nothing about that failure announces itself.
//
// gzip via the platform's own CompressionStream rather than a library. A backup has to be decodable
// by whatever version of the extension is installed when someone finally needs it, possibly after a
// reinstall on a new machine, and a bundled compressor is a version to drift. The browser's is not.
//
// base64 rather than raw bytes, for two reasons. `chrome.storage` values must survive a JSON round
// trip, which binary strings do not. And base64 is pure ASCII -- no quotes to escape, no multi-byte
// characters, no surrogate pairs -- so the size of a chunk once stringified is exactly its length
// plus two, which is the only part of this system where the storage quota is predictable.

/** Marks how a backup's payload was written, so a reader knows what it is holding. */
export type BackupEncoding = 'plain' | 'gzip-b64'

async function collect(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const parts: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value)
    total += value.length
  }
  const out = new Uint8Array(total)
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}

// Streams and TextEncoder only -- deliberately no Blob or Response, which are not uniformly present
// across a service worker, a content script and the test environment.
//
// Typed structurally rather than as TransformStream<Uint8Array, Uint8Array>: the DOM lib declares
// CompressionStream through GenericTransformStream, whose readable and writable carry no element
// type, so the narrower signature does not accept the very streams this exists to drive.
type ByteTransform = { writable: WritableStream<BufferSource>; readable: ReadableStream }

async function through(bytes: Uint8Array, transform: ByteTransform): Promise<Uint8Array> {
  const writer = transform.writable.getWriter()
  // Both halves of a transform reject when it fails -- gunzip on something that is not gzip rejects
  // the write as well as the read. Discarding the write side with `void` leaves that rejection
  // unattended, which in a service worker is an unhandled rejection with nobody to catch it, from a
  // path whose whole job is to fail cleanly on a corrupt payload.
  //
  // So it is handled here and the failure is taken from the read side, which is the one carrying the
  // useful cause.
  //
  // The cast is a disagreement between declarations rather than about values: the DOM lib types a
  // stream's input as BufferSource, whose views are pinned to a non-shared ArrayBuffer, while
  // TextEncoder hands back Uint8Array<ArrayBufferLike>. Nothing here is ever backed by a
  // SharedArrayBuffer, and the round-trip tests are what actually hold this honest.
  const pumped = writer
    .write(bytes as unknown as BufferSource)
    .then(() => writer.close())
    .catch(() => undefined)
  try {
    return await collect(transform.readable as ReadableStream<Uint8Array>)
  } finally {
    await pumped
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  // In fixed slices: String.fromCharCode is applied through spread, and a whole library at once
  // would exceed the argument limit and throw on exactly the large inputs this exists to handle.
  const SLICE = 0x8000
  let binary = ''
  for (let index = 0; index < bytes.length; index += SLICE) {
    binary += String.fromCharCode(...bytes.subarray(index, index + SLICE))
  }
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

/** Compress text to a base64 payload safe to store and to chunk. */
export async function encodeBackup(text: string): Promise<string> {
  const gzipped = await through(new TextEncoder().encode(text), new CompressionStream('gzip'))
  return bytesToBase64(gzipped)
}

/**
 * Reverse `encodeBackup`.
 *
 * Throws on anything malformed rather than returning a partial string: the caller turns that into
 * the same `corrupt` outcome a failed checksum produces, which is the honest answer either way --
 * something is there and it is not the library.
 */
export async function decodeBackup(payload: string): Promise<string> {
  const raw = await through(base64ToBytes(payload), new DecompressionStream('gzip'))
  return new TextDecoder().decode(raw)
}

/**
 * Decode according to what the manifest says it wrote.
 *
 * `plain` is not a format anything writes any more -- it is what backups made before compression
 * are, and they have to keep restoring. A backup is the one thing that cannot have a flag day.
 */
export async function decodeWith(payload: string, encoding: BackupEncoding | undefined): Promise<string> {
  return encoding === 'gzip-b64' ? decodeBackup(payload) : payload
}
