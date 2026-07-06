import { composeShadowBundle } from '../../../styles/baseBundle';
import styles from './suggestionsOverlayStyles.css?raw';

export const SUGGESTIONS_OVERLAY_STYLES = styles;

export const SUGGESTIONS_OVERLAY_BUNDLE = composeShadowBundle({
  componentStyles: [SUGGESTIONS_OVERLAY_STYLES],
});
