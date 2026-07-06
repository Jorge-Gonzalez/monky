import RESET_STYLES from './substrate/reset.css?raw'
import METRIC_STYLES from './theme/metrics.css?raw'
import FONT_STYLES from './theme/font.css?raw'
import LEGACY_GRAMMAR_STYLES from './grammar/legacy.css?raw'
import GENERATED_GRAMMAR_STYLES from './grammar/ermine.generated.css?raw'
import CONTROL_SKIN_STYLES from './skin/controls.css?raw'
import SURFACE_SKIN_STYLES from './skin/surfaces.css?raw'
import TYPOGRAPHY_SKIN_STYLES from './skin/typography.css?raw'

export const STYLE_LAYER_ORDER = '@layer reset, theme, grammar, skin, components, overrides;'

export const BASE_SHADOW_STYLE_INPUTS = {
  reset: RESET_STYLES,
  theme: [METRIC_STYLES, FONT_STYLES].join('\n'),
  legacyGrammar: LEGACY_GRAMMAR_STYLES,
  skin: [CONTROL_SKIN_STYLES, SURFACE_SKIN_STYLES, TYPOGRAPHY_SKIN_STYLES].join('\n'),
} as const

export interface ShadowBundleOptions {
  generatedGrammar?: string
  componentStyles?: readonly string[]
  overrides?: string
}

function layer(name: string, css: string): string {
  return css.trim() ? `@layer ${name} {\n${css.trim()}\n}` : ''
}

// Every Shadow-DOM consumer starts from this contract. Generated Ermine CSS has
// a named slot between the temporary legacy grammar and shared skin; U5 can fill
// it without changing how modal, suggestion, and confirmation bundles assemble.
export function composeShadowBundle(options: ShadowBundleOptions = {}): string {
  return [
    STYLE_LAYER_ORDER,
    layer('reset', BASE_SHADOW_STYLE_INPUTS.reset),
    layer('theme', BASE_SHADOW_STYLE_INPUTS.theme),
    layer('grammar', BASE_SHADOW_STYLE_INPUTS.legacyGrammar),
    layer('grammar', options.generatedGrammar ?? GENERATED_GRAMMAR_STYLES),
    layer('skin', BASE_SHADOW_STYLE_INPUTS.skin),
    layer('components', (options.componentStyles ?? []).join('\n')),
    layer('overrides', options.overrides ?? ''),
  ].filter(Boolean).join('\n\n') + '\n'
}
