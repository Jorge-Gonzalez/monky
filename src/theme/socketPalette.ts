// Monky's palette bound to Ermine's skin socket contract (project-owned; R-SKIN-08).
// The values are Monky's own humo/acera/mar tones — the primitives — mapped onto the
// semantic sockets the grammar reads. `themeSocketVars()` returns what a themed root sets:
// the socket values plus a bridge aliasing Monky's existing consumed var names to sockets,
// so component CSS keeps reading --base-tone / --harmonic / --status-error unchanged while
// the source of truth becomes the socket palette.

type Mode = 'light' | 'dark'

interface Tones {
  base: string
  toneDim: string
  tone: string
  ink: string
  inkSoft: string
  inkAlt: string
  harmonic: string
  harmonicMinor: string
  accent: string
  accentDim: string
  calm: string
  active: string
  charged: string
  still: string
  shadow: string
}

const wash = (role: string) => `color-mix(in oklch, var(--${role}) 15%, var(--ground))`
const towardInk = (pct: number) => `color-mix(in oklch, var(--ground) ${100 - pct}%, var(--ink))`
const towardAccent = (pct: number) => `color-mix(in oklch, var(--ground) ${100 - pct}%, var(--accent))`

// Ermine socket values for a theme × mode.
const sockets = (t: Tones): Record<string, string> => ({
  '--ground': t.base,
  '--ground-subtle': t.toneDim,
  '--ground-defined': t.tone,
  '--ground-hover': towardInk(8),
  '--ground-active': towardInk(16),
  '--ground-selected': towardAccent(20),
  '--ink': t.ink,
  '--ink-soft': t.inkSoft,
  '--ink-inverse': t.inkAlt,
  '--ink-selected': t.accent,
  '--rule': t.harmonic,
  '--rule-soft': t.harmonicMinor,
  '--accent': t.accent,
  '--accent-soft': t.accentDim,
  '--pass': t.calm,
  '--pass-faint': wash('pass'),
  '--warn': t.active,
  '--warn-faint': wash('warn'),
  '--fail': t.charged,
  '--fail-faint': wash('fail'),
  '--note': t.still,
  '--note-faint': wash('note'),
  '--shadow': t.shadow,
})

// Monky's consumed var names, aliased to the sockets above. Names that already match a
// socket (--ink, --ink-soft, --accent) need no alias. --shadow-color has no socket yet.
const BRIDGE: Record<string, string> = {
  '--base-tone': 'var(--ground)',
  '--tone-dim': 'var(--ground-subtle)',
  '--tone': 'var(--ground-defined)',
  '--ink-alt': 'var(--ink-inverse)',
  '--harmonic': 'var(--rule)',
  '--harmonic-minor': 'var(--rule-soft)',
  '--accent-dim': 'var(--accent-soft)',
  '--status-error': 'var(--fail)',
  '--status-error-wash': 'var(--fail-faint)',
  '--status-success': 'var(--pass)',
  '--status-success-wash': 'var(--pass-faint)',
  '--status-warning': 'var(--warn)',
  '--status-warning-wash': 'var(--warn-faint)',
  '--status-info': 'var(--note)',
  '--status-info-wash': 'var(--note-faint)',
  '--shadow-color': 'var(--shadow)',
  // R-SKIN-15 scrollbar treatment sockets: Monky keeps its subtle-ground track
  // instead of the treatment's transparent default.
  '--scrollbar-thumb': 'var(--rule)',
  '--scrollbar-track': 'var(--ground-subtle)',
}

const TONES: Record<string, Record<Mode, Tones>> = {
  humo: {
    light: {
      base: '#ededed',
      toneDim: '#e8e9e9',
      tone: '#dee5ed',
      ink: '#101624',
      inkSoft: '#636a76',
      inkAlt: '#ffffff',
      harmonic: '#d6d8dc',
      harmonicMinor: '#e1e2e4',
      accent: '#3679e4',
      accentDim: '#c3c7cb',
      calm: '#00ad54',
      active: '#df8e01',
      charged: '#d1431f',
      still: '#2d5ae1',
      shadow: 'rgba(0,0,0,0.15)',
    },
    dark: {
      base: '#1f2937',
      toneDim: '#242c3c',
      tone: '#3b4a61',
      ink: '#f3f4f6',
      inkSoft: '#9ca3af',
      inkAlt: '#ffffff',
      harmonic: '#374151',
      harmonicMinor: '#28303b',
      accent: '#60a5fa',
      accentDim: '#4b5563',
      calm: '#9ed999',
      active: '#f4c762',
      charged: '#f9699a',
      still: '#9c81ec',
      shadow: 'rgba(0,0,0,0.4)',
    },
  },
  acera: {
    light: {
      base: '#e0e0e0',
      toneDim: '#e8e6e6',
      tone: '#eac8bd',
      ink: '#25120d',
      inkSoft: '#5d4f4b',
      inkAlt: '#ffffff',
      harmonic: '#e2aea2',
      harmonicMinor: '#eed1ca',
      accent: '#c2492a',
      accentDim: '#e46845',
      calm: '#00ad54',
      active: '#df8e01',
      charged: '#d1431f',
      still: '#2d5ae1',
      shadow: 'rgba(0,0,0,0.15)',
    },
    dark: {
      base: '#62666a',
      toneDim: '#6a6e6e',
      tone: '#565b5f',
      ink: '#ffffff',
      inkSoft: '#e4e3cf',
      inkAlt: '#ffffff',
      harmonic: '#545b5b',
      harmonicMinor: '#6c7f81',
      accent: '#ffb700',
      accentDim: '#b19e44',
      calm: '#7ecdab',
      active: '#e2b37e',
      charged: '#d36464',
      still: '#8198df',
      shadow: 'rgba(0,0,0,0.4)',
    },
  },
  mar: {
    light: {
      base: '#c9c4bf',
      toneDim: '#d4d0cc',
      tone: '#bbbfd4',
      ink: '#212935',
      inkSoft: '#657184',
      inkAlt: '#ffffff',
      harmonic: '#8f98a6',
      harmonicMinor: '#b5bac1',
      accent: '#1c59bd',
      accentDim: '#4874be',
      calm: '#05bd5e',
      active: '#d58b0b',
      charged: '#d1431f',
      still: '#2d5ae1',
      shadow: 'rgba(0,0,0,0.15)',
    },
    dark: {
      base: '#0f131b',
      toneDim: '#121720',
      tone: '#162e48',
      ink: '#d3eaf8',
      inkSoft: '#6f8fa4',
      inkAlt: '#ffffff',
      harmonic: '#203d5d',
      harmonicMinor: '#162738',
      accent: '#4cbef2',
      accentDim: '#3d6178',
      calm: '#9ed999',
      active: '#f4c762',
      charged: '#f9699a',
      still: '#9489e1',
      shadow: 'rgba(0,0,0,0.4)',
    },
  },
}

/** The custom properties a themed root sets for a given color theme and mode. */
export function themeSocketVars(colorTheme: string, isDark: boolean): Record<string, string> {
  const tones = (TONES[colorTheme] ?? TONES.humo)[isDark ? 'dark' : 'light']
  return { ...sockets(tones), ...BRIDGE }
}
