// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { decodeBackup, decodeWith, encodeBackup } from './backupCodec'

// A codec that is subtly lossy produces a backup that restores *almost* what was saved, and nothing
// about that announces itself. So these are round trips against the content that actually breaks
// encoders, not against "hello world".
const roundTrip = async (text: string) => decodeBackup(await encodeBackup(text))

describe('encodeBackup / decodeBackup', () => {
  it('returns exactly what it was given', async () => {
    const text = JSON.stringify([{ id: 1, command: '/brb', text: 'Be right back' }])
    expect(await roundTrip(text)).toBe(text)
  })

  it('survives the characters this library is actually full of', async () => {
    // Em dashes, bullets and ñ are three UTF-8 bytes apiece and were what broke the byte accounting
    // in the uncompressed path.
    const text = 'Bug 2 (ordering) — • Review code — Luna de España, cascabelera'
    expect(await roundTrip(text)).toBe(text)
  })

  it('survives emoji, which are surrogate pairs', async () => {
    const text = '😀 macro 🎉 with 👨‍👩‍👧‍👦 a family sequence'
    expect(await roundTrip(text)).toBe(text)
  })

  it('survives quotes, backslashes and newlines', async () => {
    const text = 'he said "hi"\\nand \\\\ escaped\r\n\ttabbed'
    expect(await roundTrip(text)).toBe(text)
  })

  it('handles an empty library', async () => {
    expect(await roundTrip('[]')).toBe('[]')
  })

  it('handles a payload large enough to cross the base64 slicing boundary', async () => {
    // bytesToBase64 works in 0x8000 slices because String.fromCharCode is applied through spread and
    // a whole library at once would exceed the argument limit -- on exactly the large inputs this
    // exists for. Incompressible content, so the gzip output really does get big.
    const text = Array.from({ length: 60_000 }, (_, i) => String.fromCharCode(33 + ((i * 7919) % 90))).join('')
    expect(await roundTrip(text)).toBe(text)
  })

  it('produces pure ASCII, which is what makes chunk sizing predictable', async () => {
    // No quotes to escape, no multi-byte characters, no surrogates: stringified length is exactly
    // the payload's length plus two.
    const payload = await encodeBackup(JSON.stringify([{ text: '— • 😀 "quoted"' }]))
    expect(/^[A-Za-z0-9+/=]*$/.test(payload)).toBe(true)
    expect(JSON.stringify(payload).length).toBe(payload.length + 2)
  })

  it('actually shrinks a template-shaped library', async () => {
    // The reason this exists. Each macro holds text and html side by side, near-duplicates of each
    // other, so the redundancy is within a macro as much as across the library.
    const macros = Array.from({ length: 30 }, (_, i) => ({
      id: `t${String(i)}`,
      command: `/t${String(i)}`,
      text: `Hola {{nombre}},\n\nSu pedido ${String(i)} ha sido procesado.\n\nSaludos,\nEl equipo`,
      html: `<p>Hola {{nombre}},</p><p>Su pedido ${String(i)} ha sido procesado.</p><p>Saludos,<br><strong>El equipo</strong></p>`,
      contentType: 'text/html',
    }))
    const raw = JSON.stringify(macros)
    const encoded = await encodeBackup(raw)
    expect(encoded.length).toBeLessThan(raw.length / 3)
    expect(JSON.parse(await decodeBackup(encoded))).toEqual(macros)
  })

  it('rejects a payload that is not what it claims rather than returning half of it', async () => {
    await expect(decodeBackup('bm90IGd6aXBwZWQ=')).rejects.toThrow()
  })
})

describe('decodeWith', () => {
  it('decompresses when the manifest says it was compressed', async () => {
    const text = '[{"id":1}]'
    expect(await decodeWith(await encodeBackup(text), 'gzip-b64')).toBe(text)
  })

  it('passes a plain payload through untouched', async () => {
    expect(await decodeWith('[{"id":1}]', 'plain')).toBe('[{"id":1}]')
  })

  it('treats a manifest with no encoding as plain', async () => {
    // Backups written before compression carry no encoding, and they have to keep restoring. A
    // backup is the one thing that cannot have a flag day.
    expect(await decodeWith('[{"id":1}]', undefined)).toBe('[{"id":1}]')
  })
})
