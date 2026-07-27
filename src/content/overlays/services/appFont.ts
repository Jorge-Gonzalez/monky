import FONT_FACE_STYLES from '../../../styles/theme/font-face.css?raw'
import { createStyleInjector } from './styleInjector'

// font-face.css is a separately named bundle input. Every `/fonts/*` URL in it is
// late-bound to the extension resource so the faces load inside content-script
// shadow roots, where a root-relative URL would resolve against the host page.
let registered = false

function extensionBoundFontFace(): string {
  return FONT_FACE_STYLES.replace(/url\('\/(fonts\/[^']+)'\)/g, (_, file: string) =>
    `url('${chrome.runtime.getURL(file)}')`,
  )
}

export function ensureAppFontFace(): void {
  if (registered) return
  createStyleInjector('monky-font-face', extensionBoundFontFace()).inject()
  registered = true
}
