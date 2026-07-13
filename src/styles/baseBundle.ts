import RESET_STYLES from './substrate/reset.css?raw'
import METRIC_STYLES from './theme/metrics.css?raw'
import ERMINE_CONFIG_STYLES from './theme/ermine.config.css?raw'
import FONT_STYLES from './theme/font.css?raw'
import GENERATED_GRAMMAR_STYLES from './grammar/ermine.generated.css?raw'
import CONTROL_SKIN_STYLES from './skin/controls.css?raw'

export const STYLE_LAYER_ORDER = '@layer reset, theme, grammar, skin, components, overrides;'

export const BASE_SHADOW_STYLE_INPUTS = {
  reset: RESET_STYLES,
  theme: [METRIC_STYLES, ERMINE_CONFIG_STYLES, FONT_STYLES].join('\n'),
  // surfaces.css retired: the section/alert/card/divider families are pure words now.
  skin: CONTROL_SKIN_STYLES,
} as const

export interface ShadowBundleOptions {
  generatedGrammar?: string
  componentStyles?: readonly string[]
  overrides?: string
}

function layer(name: string, css: string): string {
  return css.trim() ? `@layer ${name} {\n${css.trim()}\n}` : ''
}

// Every Shadow-DOM consumer starts from this contract. Generated Ermine CSS is the
// sole grammar source now that the temporary legacy sheet is retired (U8); modal,
// suggestion, and confirmation bundles assemble identically around it.
export function composeShadowBundle(options: ShadowBundleOptions = {}): string {
  return [
    STYLE_LAYER_ORDER,
    layer('reset', BASE_SHADOW_STYLE_INPUTS.reset),
    layer('theme', BASE_SHADOW_STYLE_INPUTS.theme),
    layer('grammar', options.generatedGrammar ?? GENERATED_GRAMMAR_STYLES),
    layer('skin', BASE_SHADOW_STYLE_INPUTS.skin),
    layer('components', (options.componentStyles ?? []).join('\n')),
    layer('overrides', options.overrides ?? ''),
  ].filter(Boolean).join('\n\n') + '\n'
}
