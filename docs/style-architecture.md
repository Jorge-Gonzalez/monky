# Monky style architecture

Monky owns application identity and its current skin. Ermine owns grammar decisions. This file
defines how those concerns are delivered while the adoption ledger moves declarations between them.

## Cascade contract

Every page and Shadow Root uses the same order:

```css
@layer reset, theme, grammar, skin, components, overrides;
```

| Layer | Source | Ownership |
|---|---|---|
| `reset` | `styles/substrate/reset.css` | Browser normalization and box substrate |
| `theme` | `styles/theme/{metrics,font-face,font}.css` | Monky's bound values and font delivery |
| `grammar` | generated Ermine slot, preceded temporarily by `grammar/legacy.css` | Structural vocabulary and emission |
| `skin` | `styles/skin/{controls,surfaces,typography}.css` | Shared Monky appearance |
| `components` | co-located component CSS and `styles/components/*` | Product identity |
| `overrides` | explicit consumer override input | Exceptional, named last-mile adjustments |

`src/styles.css` is an import manifest for extension pages. Shadow consumers call
`composeShadowBundle()` from `styles/baseBundle.ts`; modal, suggestions, and delete confirmation
all append their component sheets through that one contract. Font-face registration remains a
separate document-level input because font resources cross Shadow boundaries.

`grammar/legacy.css` is compatibility evidence, not authority. Do not add new vocabulary there.
The `generatedGrammar` argument is the insertion point for CSS produced by Ermine U3.

## Theme binding is an adoption gate

Scale and breakpoint values are late-bound, but they are not silently inferred. For every used
Ermine scale, adoption follows this sequence:

```text
measure existing project values
  -> propose a semantic binding
  -> obtain human approval
  -> commit the project theme binding
  -> compile generated Ermine CSS
```

Automation may measure repeated values and propose candidates. It may not decide that a numeric
value means `comfortable`, `md`, or any other semantic step. Ordered bindings must preserve their
Ermine ordering constraints. An ambiguous candidate remains `uncertain`; a missing constitutional
decision becomes a Gap Report. A compiler must fail a used unbound value rather than guess it.

The values currently in `theme/metrics.css` are the preserved pre-U4 Monky metrics. Their location
does not itself approve an Ermine mapping. U5 must record the approved mapping before filling the
generated grammar slot.

## U4 conservation and behavior evidence

The U2 baseline contains 1,409 declarations: 1,396 in CSS files and 13 in one TypeScript template.
After the split, 1,401 declarations remain in standalone CSS and no live CSS template remains in
TypeScript. The other eight declarations were already dead at delivery: `modalManager.ts` removed
the `#monky-modal` root block and its child pointer-event block with regular expressions before
injecting the stylesheet. U4 removed both the dead declarations and the regex surgery.

`npm run test:styles` launches Chromium against the real page import manifest and the real Shadow
bundle function. It freezes representative computed properties from the pre-U4 page, modal,
suggestions, and delete-confirmation contexts. The U4 result is byte-independent but
outcome-equivalent for every probed property.

Validation:

```sh
npm test
npm run test:styles
npm run lint:css
npm run build
```
