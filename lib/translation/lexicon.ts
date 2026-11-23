// Lexicon data model (client-safe: no database imports, no word lists).
// All Agusan Manobo words, phrases, dictionary entries, dialect variants and affixes live in the
// LexiconEntry database table (managed in Admin → Lexicon). data/lexicon.json is only the seed
// source and the offline fallback. This module turns those rows into lookup structures.

export const LEXICON_KINDS = ['PHRASE', 'WORD', 'WEBONARY', 'DIALECT_VARIANT', 'PREFIX', 'SUFFIX'] as const
export type LexiconKind = (typeof LEXICON_KINDS)[number]

/** One row of the LexiconEntry table (or of data/lexicon.json). */
export interface LexiconRow {
  id?: string
  kind: LexiconKind
  manobo: string
  english?: string | null
  bisaya?: string | null
  tagalog?: string | null
  root?: string | null
  partOfSpeech?: string | null
  definition?: string | null
  notes?: string | null
  reference?: string | null
  entryTitle?: string | null
  group?: string | null
  source?: string | null
  sortOrder?: number
  isActive?: boolean
}

export interface ParallelPhrase {
  english: string
  manobo: string
  bisaya: string
  tagalog: string
  context?: string
  verseRef?: string
  entryTitle?: string
}

export interface LexiconWord {
  english: string
  manobo: string
  bisaya: string
  tagalog: string
  category: string
  notes?: string
  group?: string
}

export interface WebonaryEntry {
  manobo: string
  root: string
  partOfSpeech: string
  english: string
  bisaya: string
  source: string
  definition?: string
}

export interface Lexicon {
  phrases: ParallelPhrase[]
  words: LexiconWord[]
  webonary: WebonaryEntry[]
  dialectVariants: Record<string, { standard: string; notes: string }>
  prefixes: string[]
  suffixes: string[]
  /** Vocabulary group display order for the Translator page. */
  groupOrder: string[]
  origin: 'database' | 'fallback-json' | 'empty'
  /** Server only: words attested in the Agusan Manobo Bible → example reference and frequency */
  attested?: Map<string, { ref: string; count: number }>
}

export const EMPTY_LEXICON: Lexicon = {
  phrases: [],
  words: [],
  webonary: [],
  dialectVariants: {},
  prefixes: [],
  suffixes: [],
  groupOrder: [],
  origin: 'empty',
}

const s = (v: string | null | undefined) => (v ?? '').toString()

/** Builds lookup structures from lexicon rows (active rows only, in sortOrder). */
export function buildLexicon(rows: LexiconRow[], groupOrder: string[] = [], origin: Lexicon['origin'] = 'database'): Lexicon {
  const active = rows.filter(r => r.isActive !== false).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const lex: Lexicon = { ...EMPTY_LEXICON, dialectVariants: {}, origin }

  for (const r of active) {
    switch (r.kind) {
      case 'PHRASE':
        lex.phrases.push({
          english: s(r.english),
          manobo: s(r.manobo),
          bisaya: s(r.bisaya),
          tagalog: s(r.tagalog),
          context: r.notes ?? undefined,
          verseRef: r.reference ?? undefined,
          entryTitle: r.entryTitle ?? undefined,
        })
        break
      case 'WORD':
        lex.words.push({
          english: s(r.english),
          manobo: s(r.manobo),
          bisaya: s(r.bisaya),
          tagalog: s(r.tagalog),
          category: s(r.partOfSpeech) || 'NOUN',
          notes: r.notes ?? undefined,
          group: r.group ?? undefined,
        })
        break
      case 'WEBONARY':
        lex.webonary.push({
          manobo: s(r.manobo),
          root: s(r.root) || s(r.manobo),
          partOfSpeech: s(r.partOfSpeech) || 'NOUN',
          english: s(r.english),
          bisaya: s(r.bisaya),
          source: s(r.source) || 'SIL Webonary',
          definition: r.definition ?? undefined,
        })
        break
      case 'DIALECT_VARIANT':
        if (r.manobo && r.root) lex.dialectVariants[r.manobo.toLowerCase()] = { standard: r.root, notes: s(r.notes) }
        break
      case 'PREFIX':
        lex.prefixes.push(r.manobo.toLowerCase())
        break
      case 'SUFFIX':
        lex.suffixes.push(r.manobo.toLowerCase())
        break
    }
  }

  const groups = new Set(lex.words.map(w => w.group).filter(Boolean) as string[])
  lex.groupOrder = [...groupOrder.filter(g => groups.has(g)), ...Array.from(groups).filter(g => !groupOrder.includes(g))]
  return lex
}

type LangKey = 'en' | 'msm' | 'ceb'
const FIELD: Record<LangKey, 'english' | 'manobo' | 'bisaya'> = { en: 'english', msm: 'manobo', ceb: 'bisaya' }

/** Verified lexicon pairs that occur in the input (phrases first, then words) — used to ground the LLM. */
export function glossaryFor(text: string, source: LangKey, target: LangKey, lex: Lexicon): { source: string; target: string }[] {
  const lower = ` ${text.toLowerCase().replace(/[.,!?;:"“”()]/g, ' ').replace(/\s+/g, ' ')} `
  const tokens = new Set(lower.trim().split(' '))
  const out = new Map<string, string>()
  for (const p of lex.phrases) {
    const s = p[FIELD[source]]?.toLowerCase().trim()
    const t = p[FIELD[target]]?.trim()
    if (s && t && lower.includes(` ${s} `)) out.set(s, t)
  }
  for (const w of [...lex.words, ...lex.webonary]) {
    const s = w[FIELD[source]]?.toLowerCase().trim()
    const t = w[FIELD[target]]?.trim()
    if (s && t && !out.has(s) && tokens.has(s)) out.set(s, t)
  }
  return Array.from(out, ([s, t]) => ({ source: s, target: t }))
}

/** Groups dialect variants by standard spelling (for orthographic fuzzy matching). */
export function dialectVariantGroups(lex: Lexicon): { canonical: string; variants: string[]; gloss: string }[] {
  const groups = new Map<string, { canonical: string; variants: string[]; gloss: string }>()
  for (const [variant, v] of Object.entries(lex.dialectVariants)) {
    const g = groups.get(v.standard) ?? { canonical: v.standard, variants: [], gloss: '' }
    g.variants.push(variant)
    if (!g.gloss) {
      const w = lex.webonary.find(e => e.manobo === v.standard || e.root === v.standard)
      g.gloss = w?.english || v.notes
    }
    groups.set(v.standard, g)
  }
  return Array.from(groups.values())
}

/** Normalizes admin input into LexiconEntry columns (empty strings become null). */
export function lexiconDataFromBody(body: any) {
  const opt = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  return {
    kind: body.kind as LexiconKind,
    manobo: String(body.manobo).trim(),
    english: opt(body.english),
    bisaya: opt(body.bisaya),
    tagalog: opt(body.tagalog),
    root: opt(body.root),
    partOfSpeech: opt(body.partOfSpeech),
    definition: opt(body.definition),
    notes: opt(body.notes),
    reference: opt(body.reference),
    entryTitle: opt(body.entryTitle),
    group: opt(body.group),
    source: opt(body.source),
  }
}

/** Validates admin input for a lexicon row. Returns an error message or null. */
export function validateLexiconRowInput(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body'
  if (!(LEXICON_KINDS as readonly string[]).includes(body.kind)) return `Kind must be one of: ${LEXICON_KINDS.join(', ')}`
  if (!body.manobo || typeof body.manobo !== 'string' || !body.manobo.trim()) return 'Manobo form is required'
  if ((body.kind === 'PHRASE' || body.kind === 'WORD' || body.kind === 'WEBONARY') && !body.english?.trim())
    return 'English is required for phrases, words and dictionary entries'
  if (body.kind === 'DIALECT_VARIANT' && !body.root?.trim()) return 'Standard spelling (root) is required for a dialect variant'
  return null
}
