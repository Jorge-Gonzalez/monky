// Every class name used in markup must have a rule in the stylesheets.
//
// The Ermine CSS is compiled from `ermine.elements.json`, not from the source, and that
// manifest is deliberately hand-maintained -- a literal scanner cannot see class strings
// built at runtime. The cost is that markup can outrun the manifest: add a word to a
// component, forget the manifest entry, and the rule is simply never emitted. The style
// vanishes in the real extension while every other gate stays green, because jsdom does not
// load CSS and the style smoke test renders its own fixture.
//
// Nothing else checks this. Today it passes only because words are shared across many
// elements, so a word missed at one site usually survives via another. That is luck, not a
// guarantee, and it runs out the first time a word is introduced at a single site.
//
// The reverse direction -- CSS defined but never used -- is `npm run audit:styles`, which
// needs a build and a browser. This one needs neither.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

const walk = (dir, test) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path, test)
    return test(entry.name) ? [path] : []
  })

/**
 * Reads class values without regex-matching across structure. `className=` is followed
 * either by a quoted string or by a braced expression; the braced form is scanned with a
 * depth counter, and inside it the literal text of template literals (with `${…}` spans
 * removed) and any plain quoted strings are the candidate class lists. Matching quotes with
 * a pattern instead pairs the opening backtick with the first apostrophe and drags the
 * condition of a ternary in with it.
 */
function classValues(source) {
  const values = []
  const attribute = /\b(?:class|className)\s*=\s*/g
  let m
  while ((m = attribute.exec(source)) !== null) {
    let i = m.index + m[0].length
    const ch = source[i]
    if (ch === '"' || ch === "'") {
      const end = source.indexOf(ch, i + 1)
      if (end === -1) continue
      values.push(source.slice(i + 1, end))
      attribute.lastIndex = end
      continue
    }
    if (ch !== '{') continue
    let depth = 0
    const start = i
    while (i < source.length) {
      if (source[i] === '{') depth++
      else if (source[i] === '}') {
        depth--
        if (depth === 0) break
      }
      i++
    }
    values.push(...literalsIn(source.slice(start + 1, i)))
    attribute.lastIndex = i
  }
  return values
}

/**
 * Template-literal text with interpolations blanked, the quoted strings *inside* those
 * interpolations, and any plain quoted strings. The middle one matters: a conditional class
 * lives in the arms of a ternary inside `${…}`, so blanking the span without reading it
 * first loses exactly the words most likely to be wrong.
 */
function literalsIn(expression) {
  const out = []
  let rest = expression
  for (const t of expression.matchAll(/`([^`]*)`/g)) {
    const body = t[1]
    out.push(body.replace(/\$\{[^}]*\}/g, ' '))
    for (const span of body.matchAll(/\$\{([^}]*)\}/g)) {
      // Drop comparison operands first: `placement === 'top' ? …` holds a value, not a
      // class, and taking every quoted string in the span would report `top` as a word.
      const arms = span[1].replace(/[=!]==?\s*(['"])[^'"]*\1/g, ' ')
      for (const q of arms.matchAll(/'([^']*)'|"([^"]*)"/g)) out.push(q[1] ?? q[2] ?? '')
    }
    rest = rest.replace(t[0], ' ')
  }
  for (const q of rest.matchAll(/'([^']*)'|"([^"]*)"/g)) out.push(q[1] ?? q[2] ?? '')
  return out
}

// tests/style-smoke-fixture.ts is markup too: it renders against the same stylesheet, and
// Ermine's paragraph formatter already treats it as a source of class paragraphs. Leaving it
// out is how a rule removed from the grammar can silently change what the smoke test measures.
const MARKUP_FILES = () => [
  ...walk(SRC, (n) => /\.(tsx|jsx|ts|js)$/.test(n) && !/\.test\./.test(n)),
  join(ROOT, 'tests/style-smoke-fixture.ts'),
]

function usedWords() {
  const used = new Map()
  for (const file of MARKUP_FILES()) {
    for (const value of classValues(readFileSync(file, 'utf8'))) {
      for (const word of value.split(/\s+/).filter(Boolean)) {
        if (!/^[a-z][a-z0-9:-]*$/.test(word)) continue
        if (!used.has(word)) used.set(word, new Set())
        used.get(word).add(relative(ROOT, file))
      }
    }
  }
  return used
}

function definedSelectors() {
  const css = walk(join(SRC, 'styles'), (n) => n.endsWith('.css'))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n')
  // A class occurrence is `.name` where `:` may be backslash-escaped, ended by anything
  // that cannot continue an identifier.
  const defined = new Set()
  for (const match of css.matchAll(/\.((?:[a-zA-Z0-9_-]|\\:)+)/g)) {
    defined.add(match[1].replace(/\\/g, ''))
  }
  return defined
}

const used = usedWords()
const defined = definedSelectors()
const missing = [...used].filter(([word]) => !defined.has(word))

if (missing.length === 0) {
  console.log(`class words: ${used.size} used, all resolved in the stylesheets`)
  process.exit(0)
}

console.error(`class words: ${missing.length} used in markup with no rule in any stylesheet\n`)
for (const [word, files] of missing.sort((a, b) => b[1].size - a[1].size)) {
  console.error(`  ${word}`)
  for (const file of [...files].sort()) console.error(`      ${file}`)
}
console.error(
  '\nAn Ermine word usually means the manifest is behind the markup: add it to the element in\n' +
    'ermine.elements.json, then `npm run ermine:css -- --ermine-root ../ermine`.'
)
process.exit(1)
