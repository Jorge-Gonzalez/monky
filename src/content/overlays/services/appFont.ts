import FONT_FACE_STYLES from '../../../styles/theme/font-face.css?raw';
import { createStyleInjector } from './styleInjector';

const FONT_FILE = 'fonts/ibm-plex-sans-condensed-v15-latin-300.woff2';

// font-face.css is a separately named bundle input. Only its URL is late-bound to
// the extension resource; no CSS is extracted from or removed from another sheet.
let registered = false;

export function ensureAppFontFace(): void {
  if (registered) return;
  const fontUrl = chrome.runtime.getURL(FONT_FILE);
  const fontFace = FONT_FACE_STYLES.replace(`url('/${FONT_FILE}')`, `url('${fontUrl}')`);
  createStyleInjector('monky-font-face', fontFace).inject();
  registered = true;
}
