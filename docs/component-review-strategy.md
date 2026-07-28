# Component review strategy

How to review and clean a Monky component. Derived from the pass over `views/search/ui/`,
written so the same pass can be run over the surfaces that have not had one.

The search pass started, by accident, from a single file — `MacroSearchResults.tsx` — and
ran outward until the whole toolchain around it worked. That is the shape to expect: the
component is the entry point, not the scope.

## The premise

A component's problems arrive in three kinds, and the review is only responsible for one:

- **Mechanical** — anything `tsc`, `eslint` or the paragraph formatter can find. Never a
  review finding. Run the tools first; whatever they report is theirs to report.
- **Formatting** — how the source is laid out. Never a review finding either. Two owners,
  split at the quote mark (below).
- **Structural** — duplicated containers, parsing inlined into JSX, props that invert
  ownership, an ARIA contract that is half-wired. This is the review.

Separate them before touching anything. The first two are free.

## Before you start: the tools already pass

As of the search pass, all of these are green on `main`. **Anything a new pass reports is
new**, which is what makes them useful as a baseline rather than noise:

```
npx tsc --noEmit
npm run lint                                            # 0 problems
npx vitest run                                          # 945 passing
npm run build
npm run format:paragraphs:check -- --ermine-root ../ermine
npm run styles:reconcile:check  -- --ermine-root ../ermine
```

`npm run test:styles` is **red on purpose** and is expected to stay red until the type
scale is settled. The 298px/295px drift in the delete-confirm popup is a consequence of an
undecided font size, not a regression.

The risk here is the opposite of the usual one. Nobody is going to ignore a red gate —
somebody is going to *fix* it, by re-baselining to whatever the current render produces,
which would freeze a number that has not been chosen. Leave it. It goes green when the
font-size decision lands, and not before.

The lint config carries deliberate decisions, each with its reasoning written next to it in
`eslint.config.js`. Two are worth knowing before you trust or change it:

- **`no-unnecessary-type-assertion` is off**, on evidence. Its analysis disagrees with the
  compiler on `querySelector` results, and its autofix removed assertions `tsc` requires,
  breaking the typecheck across nine files while the runtime tests stayed green. It does
  catch genuinely redundant `!`, so a manual pass is worth doing someday — but never
  `--fix` it.
- **Test files relax six rules** (`no-explicit-any`, the `no-unsafe-*` family,
  `unbound-method`). A test double is deliberately a partial stand-in, and
  `expect(obj.method)` passes a method reference it never calls. Mocks that *do* have a
  real type available should still use it: `ReturnType<typeof factory>`.

`eslint --fix` is safe to run now, with one caveat: it has no opinion about semicolons
unless the `semi` rule tells it, which is why that rule exists. Re-run
`format:paragraphs:check` after any `--fix`; the two formatters do not fight, but confirm.

## Formatting has two owners, and the boundary is the quote mark

**Inside the quotes — Ermine.** Word order is derived from the registry; line breaks group
the words by plane. There is no order to memorize and nothing to hand-edit.

**Outside the quotes — JSX layout.** Attribute placement and the closing `>`. This follows
from the paragraph rather than being an independent choice: a paragraph long enough to span
lines forces the element vertical, and once it is vertical the `>` belongs on its own line
at the element's indent, closing the attribute block the way a `)` closes an argument list.

```tsx
<div
  data-component="search-empty"
  className="span-all padding-lg
    ink-soft font-md text-center"
>
```

That is exactly Prettier's default output (`bracketSameLine: false`), so the convention is
derivable rather than a house style anyone has to remember. It is still maintained by hand:
`.prettierrc` is now consistent with the code (`semi: false`, matching all 160 source
files), but the repo is not Prettier-formatted and `npm run format` would rewrite it
wholesale — it reflows 786 lines of `i18n.ts` alone, and fights Ermine's paragraph layout.
**Do not run `prettier --write` repo-wide.** The `semi` rule in ESLint enforces the one part
of it that matters.

## Order of operations

Structural fixes first, formatting last. Formatting rewrites paragraph layout across whole
files; doing it first means every structural diff afterwards is polluted by reflowed class
strings and the reviewer cannot see the actual change.

1. **Establish a clean baseline.** `git status` the target directory *before* editing. A
   layout pass run by hand but never committed will otherwise be attributed to your
   refactor. Commit or stash it first.
2. **Structural fixes**, smallest blast radius first, each verified before the next.
3. **Tests** for whatever the fixes touched, before formatting muddies the diff.
4. **Format the paragraphs**: `npm run format:paragraphs -- --ermine-root ../ermine`. The
   bare script writes; `format:paragraphs:check` gates. (They were both hardcoded to
   `--check` until the search pass; if you find a wrapper that cannot write, that is the
   bug.) It rewrites `ermine.elements.json` too, since the manifest stores class strings.
5. **Commit.** Not optional — the next step refuses to run otherwise.
6. **`npm run styles:reconcile -- --ermine-root ../ermine`**, then commit the ledger in the
   Ermine repo. It requires a **clean worktree** because it records the project commit, so
   it cannot run against work in progress. Expect a commit-pointer-only diff; if the
   vocabulary or declaration count moves, a class word was added and that is worth saying
   out loud in the message.

## Do the extraction by hand

Every extraction here is a structural edit to JSX — moving an open tag, its matching close,
and everything between. **Do not do it with regex or `sed`/`perl`.** In this project that
has failed twice destructively: a `perl` substitution using `|` as both delimiter and
pattern content corrupted `SuggestionsOverlayManager.tsx` into unusable output, and a
pattern-driven attempt at the settings extraction matched the opening tags but not their
closers and left the tree unbalanced. Both were reverted from the last commit; neither was
caught by the pattern itself, only by `tsc` afterwards.

A regex sees text; the edit is on a tree. Rewrite the render by hand, or use a real codemod.
Hand-writing a forty-line render is faster than debugging a substitution that half-worked.

## What counts as a structural finding

Six patterns, in descending value. All six came out of one file.

**Repeated container paragraphs are a missing component.** A long layout paragraph at more
than one call site is a component that has not been extracted. The tell is not the
duplication but the *drift*: one copy gets reformatted and the others do not, and nothing in
the toolchain catches it because each copy is independently valid.

Two constraints when extracting:

- The extracted element must stay the **direct grid parent** of the rows. `subgrid`
  resolves against the immediate parent, so an extra wrapping `div` silently breaks column
  alignment. Never insert a layer.
- Roles belong to the caller. A panel showing a hint is not a `listbox`; one showing options
  is. Pass `role` in rather than baking it in.

**An early return that duplicates the whole tree is a branch in the wrong place.** Once the
container is a component, `if (empty) return <container>…</container>` collapses to a
ternary inside it. Branch on the part that differs.

**Parsing inlined into JSX duplicates a module you already import.** `MacroSearchResults`
imported `hasPlaceholders` from `placeholders.ts` and re-implemented that module's regex
inline. Push the split into the owning module and lift the render into a small component —
and usually the guard disappears too, because a splitter returns `[text]` for the trivial
case and renders identically.

There is a quieter payoff every time. Logic inlined in JSX tends to be **untested**, and the
test file proves it: `MacroSearchResults.test.tsx` mocked `hasPlaceholders` to return
`false`, so the highlight branch had never executed. Treat a `vi.mock` of a pure local
module as a smell — it is usually routing around logic that should not be in the component.

**Refs threaded as props invert ownership.** `forwardRef` is the reflex and usually the
wrong answer; it keeps the ref travelling, just through a wrapper. Ask **why the parent
wants the element**. In the search view the answer was `useScrollIntoView`, a behaviour
belonging to the scroll container itself. Moving the hook *into* the panel deleted a
`useRef`, a hook call, and a prop from three components. Move the behaviour to the element
rather than shipping the element out to the behaviour.

**A type that misdescribes its value.** `OptionsApi` declared its setters with method
shorthand — `setPrefixes(p: string[]): void` — which tells TypeScript they may depend on
`this`, so every destructuring of them across three views was an `unbound-method` error.
They are plain store functions. Function-typed properties (`setPrefixes: (p: string[]) =>
void`) is the declaration that matches how they are used, and fixes all of it at the source.

**An `any` is reported where it is used, not where it was lost.** The `no-unsafe-*` family
fires once per *use*, so one bad annotation becomes dozens of errors far from the cause.
Two consequences: never triage this family by count, and always fix at the declaration.
`lib/sync.ts` had implicit `any` on every parameter and accounted for 89 errors on its own.

## Hooks

`react-hooks` runs now (`rules-of-hooks` as an error, `exhaustive-deps` as a warning). The
compiler-oriented rules in the plugin's recommended preset are deliberately **not** enabled:
they target React Compiler adoption and this is Preact.

Two findings generalize:

**A hook that memoizes its callbacks but returns a fresh object defeats itself.**
`useListNavigation` wrapped every callback in `useCallback` and then returned them in an
object literal, so any consumer depending on `navigation` depended on every render.
Destructure at the call site — the callbacks are the stable part. If a hook's return value
is used as a dependency anywhere, either it is memoized or its consumers must destructure.

**A value derived on every render propagates into every dependency array below it.**
`parseModalQuery` ran unmemoized, so `parsed` and everything computed from it was a new
identity each render. `useMemo` at the source is cheaper than suppressions downstream.

**Detecting a dead effect takes two runs, not one.** `MacroSearchView` had a
`useEffect(() => { reset() }, [parsed.mode, reset])` that no test could observe. Disabling
it changed nothing — but *re-enabling* it also changed nothing, and that is the half that
matters. A guard invisible in both directions is not guarding. Before concluding, reason
about ordering explicitly: a hook called earlier in the body declares its effects earlier,
so `useListNavigation`'s internal clamp runs before any effect the view declares.

## The accessibility check

Ermine rewards putting state in the DOM — `[aria-selected]` drives `selected:` and
`parent-selected:` variants, so the ARIA attribute is load-bearing for *styling*. That makes
it easy to assume the a11y contract is complete because the styling works. It is not the
same contract, and **the styling looks right whether or not any of it is present.**

For any `role="listbox"`, verify separately: the list has an accessible name; each option
has an `id`; the element holding focus carries `aria-activedescendant` and `aria-controls`;
and non-option children live outside the listbox, which may contain only `option` and
`group`.

The pattern that satisfies all four without restructuring the DOM (which `subgrid` forbids
anyway) is to make the **role conditional rather than the markup conditional**:

- `role="listbox"` only when the panel holds options. An empty or hint panel has no role,
  which resolves the invalid content model by deletion.
- Empty states and hints take `role="status"`, so "no macros found" is announced instead of
  silently replacing the options.
- Option ids derive from **position**, not the item's own id (`searchOptionId(index)`).
  That is what lets the input name the active option knowing only `selectedIndex`.
- The input becomes the combobox: `role="combobox"`, `aria-expanded`, `aria-controls` (only
  while a listbox exists), `aria-activedescendant`, `aria-autocomplete="list"`.

Export the listbox id and option-id helper from the panel component — one contract shared
by every file that participates.

**Then check what is nested inside the options.** ARIA gives `role="option"` *presentational
children*: everything below it is dropped from the accessibility tree. Two things therefore
look right in the markup and do nothing:

- **A live region inside an option is never announced.** In the search view this was the
  `role="alert"` on the delete confirmation — the one destructive action, and the one thing
  a screen-reader user would not have been told. State has to reach AT through the option's
  own accessible name, which is the only channel an option has.
- **A control inside an option is not a control.** A listbox option cannot hold a working
  button; the pattern does not allow it. Either hide it (`aria-hidden`) and make the
  keyboard path explicit elsewhere, or — if the row genuinely needs per-row actions — the
  widget is a `grid` with `row`/`gridcell`, not a `listbox`. Do not leave a button that is
  in the DOM but not in the tree.

This survived a dedicated accessibility pass that added ids, labels and
`aria-activedescendant`. Getting the wiring right and getting the content model right are
separate checks, and passing the first says nothing about the second.

It is not fixed anywhere else yet. Every remaining listbox nests a `<button>` inside its
rows — `MacroSuggestions`, `DeleteConfirmPopup`, `ContentEditorStyleMenu` — and
`CommandSuggestions` has the inverse defect: `aria-selected` on rows with **no**
`role="option"` at all, which is invalid on a plain `div`.

`aria-expanded` deserves a moment's thought each time. In the search view it degenerates to
"options exist" because the panel is always visible; where there is a real popup it means
what it says. If a surface ever gains a collapsed state, the two must be separated.

## Testing what you changed

**Unit-testable children are not the gap. The wiring is.** Before the pass,
`MacroSearchResults`, `MacroSearchFooter` and `modalCommands` had 58 tests between them and
the view that wires them together had none.

Write a **component-level integration test**, not an E2E. The failure mode worth catching is
effect and dependency wiring, which jsdom observes directly; a browser test needs a host
page, Shadow DOM and the chrome APIs, runs far slower, and does not localize a regression.
`MacroSearchView.test.tsx` is the model, `ModalMacroForm.test.tsx` the precedent:

- Let the hooks, the parser, the search and every child run **for real**. Stub only the
  edges: `i18n`, the store selector, and any crud call that would reach `chrome.storage`.
- Drive through the UI, never through props — `fireEvent.input` on the field, and
  `fireEvent.keyDown(document, …)` because `useKeyboardNavigation` listens on `document` in
  the capture phase.
- Assert on the DOM contract (`role="option"`, `aria-selected`, `aria-activedescendant`).
  The tests then double as regression protection for the a11y wiring, and survive
  refactors: extracting the results panel changed no assertion, because nothing binds to
  class names. Prefer `data-component` for any new hook.

**Then verify the tests can fail.** This is not optional discipline; two of the first
assertions written for `MacroSearchView` were wrong in ways that green did not reveal:

- One asserted a true fact for a false reason. "Switching to command mode resets the
  selection" passed — and still passed after the reset was deleted, because typing `:`
  changes the query and the auto-select effect sets index 0 regardless.
- One was trivially true. "No stale selection after a prefixes change" asserted no selected
  option while in a mode that renders **no options at all**. Rewritten as a round trip back
  to a populated list, it fails when the mechanism breaks.

Mutating is cheap: break the behaviour, run the file, confirm the expected tests go red,
restore. Record what died in the commit message. For the search view: disabling auto-select
fails 10 of 20, deleting on the first Enter fails both delete tests, dropping the disarm
effect fails exactly one.

**When a test needs a workaround, diagnose before you write it.** `SettingsView`'s file
input would not respond to `fireEvent.change`, and the first comment written next to the
workaround named a cause that was inferred rather than checked (`files` is read-only, so
testing-library's target assignment fails). Bisecting killed it: the call fails with **no**
`target` option at all, and a text input in the same file passes.

The real cause is a disagreement between two libraries. preact/compat rewrites `onChange`
to the `input` event for inputs *except* `file`, `checkbox` and `radio`
(`compat/src/render.js`, `onChangeInputType`), so a file input genuinely listens for
`change`. `@testing-library/preact` renames `change` → `input` whenever compat is detected,
with no such exemption (`fire-event.js`, `renameEventCompat`). So `fireEvent.change` fires
`input` at an element listening for `change`.

Two things follow, and they are the reason it was worth checking. The component is
**correct** — a browser fires `change` on a file input — so nothing was hiding behind the
green test. And the trap is not limited to file inputs: it applies to checkboxes and radios
too, which is where to look first if one of those ever tests green while doing nothing. (In
this codebase they are all driven with `fireEvent.click`, which is unaffected.)

The general shape still holds: reaching below the framework means the test no longer
exercises the path a user takes, so it has to be a decision with a confirmed reason. The
difference between the two comments above is the difference between a note and a guess.

## What not to raise

- Anything `tsc`, `eslint` or the paragraph formatter reports. Run them; they are not
  review comments.
- Word order or line breaks inside a paragraph, or vertical attributes and `>` placement
  outside it. Formatting has owners.
- Long paragraphs as such. Fifteen words on an element is the cost Ermine is deliberately
  paying; it is a finding only when the *same* fifteen words appear on several elements.
- `hidden truncate` recurring at every truncation site. Real, but a grammar-side
  observation — a two-word idiom that recurs is a candidate for admission upstream. Route
  it to Ermine, do not work around it in Monky.

## The remaining surfaces

Ranked by what the tooling already knows. Regenerate the first list with the scan below.

**Duplicated paragraphs — 13 across the tree, down from 22.** Each is a candidate missing
component, and the ones spanning *files* matter more than the ones repeated within one.
Done so far: the keycap (8× across two overlays → `shared/ui/Keycap`), the modal footer's
raised keycap and hint wrapper (10× and 8× → `ShortcutHint`), and the settings section,
row, divider and button (13× in one file → `SettingsLayout`).

What is left, all cross-file:

| count | files | reading |
|---|---|---|
| 3× | `ModalMacroForm`, `MacroForm`, `SiteToggle` | a control paragraph shared by three surfaces — the biggest remaining |
| 3× | `Settings`, `PrefixEditor`, `ReplacementMode` | the options-page equivalent of the settings row |
| 2× | `ModalMacroForm`, `MacroForm` | twice more between the same pair; these two forms are near-duplicates and worth reading together |
| 2× | `MacroSearchResults`, `MacroCommandResults` | the two search result rows |
| 2× | `Editor`, `Options` | page shells |

The `ModalMacroForm` / `MacroForm` pair accounts for three of the eight. They are the modal
and full-page versions of the same form; whether that is one component with a prop or two
that share pieces is a design decision, not a mechanical extraction.

```
node -e "
const fs=require('fs'),path=require('path');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.join(d,e.name);
 return e.isDirectory()?walk(p):(/\.(tsx|ts)$/.test(e.name)&&!/\.test\./.test(e.name)?[p]:[])});
const seen=new Map();
for(const f of walk('src')) for(const m of fs.readFileSync(f,'utf8').matchAll(/className=\"([^\"]{40,})\"/g)){
  const k=m[1].split(/\s+/).filter(Boolean).sort().join(' ');
  seen.set(k,[...(seen.get(k)||[]),f]);
}
[...seen].filter(([,v])=>v.length>1).sort((a,b)=>b[1].length-a[1].length)
 .forEach(([k,v])=>console.log(v.length+'x  '+[...new Set(v)].join(', ')));
"
```

**Listbox contracts — three of four now wired, one redesign left.**

`CommandSuggestions` had `aria-selected` on rows with no `role="option"` and no listbox at
all; it now has the full contract, with the command input as its combobox. Its row buttons
are `aria-hidden`, which is a stronger statement than the search view's: they are
pointer-only *for everyone*, because the input's `onBlur` closes the dropdown, so tabbing
towards them dismisses it. Deleting a suggestion has no keyboard path — a product gap,
recorded in the component header.

`MacroSuggestions` and `DeleteConfirmPopup` have names and positional option ids now.

**What is deliberately left:** neither of those two has anything holding focus. Keys are
handled at the document level and the popups never receive focus, so
`aria-activedescendant` has nowhere to live, and the delete confirmation — a destructive
action — is not announced when it opens. `DeleteConfirmPopup` is also a confirm dialog
modelled as a listbox of two buttons, where `role="option"` on a `<button>` discards its
button semantics. The honest fix is `alertdialog` with real focus management, which in a
content script means deciding what happens to the host page's focus. That wants a decision,
not an unattended commit.

`ContentEditorStyleMenu` still has the original defect and is untouched.

**Tests.** `SettingsView` now has eleven, written with its extraction. `MacroEditorView` is
still untested — it is a 22-line wrapper, so the value is low and it is last. The other
untested files are the components this work created (`SearchResultsPanel`, `SettingsLayout`)
plus `MacroSearchInput` and `MacroCommandResults`, all covered through their parents.

## What is left is not all the same kind of work

The remaining duplication is **blocked on product scope, not waiting on a refactor**, and
an earlier version of this document had it backwards — it listed the biggest cross-file
duplication as the next thing to extract. Do not.

`ModalMacroForm` / `MacroForm`, and `Settings` / `PrefixEditor` / `ReplacementMode`, share
paragraphs because the standalone editor and options pages **predate the decision to move
the interface into the modal**. The standalone editor exists to give editing more room; the
standalone settings page is a candidate to be dropped; the popup's role is being redefined;
and the editor page may turn out to be a media-query variant rather than a separate
surface.

Extracting a shared component now would freeze a relationship that is about to change, and
the extraction would have to be undone in whichever direction the scope lands. **The
duplication is a symptom of an open product question. Leave it until the question closes** —
then the extraction is obvious and small, or unnecessary because a surface went away.

What is genuinely ready, in order:

1. `ContentEditorStyleMenu`'s listbox contract — the last one with the original defect.
2. `MacroEditorView`'s first test — a 22-line wrapper, so low value; last.

Everything else on the duplication scan is downstream of the scope decision.

---

*This file lives in `docs/`, which `.gitignore` excludes — it is force-added, as
`docs/style-architecture.md` already is. `git add -f` after editing, or it silently stops
being part of the repo.*
