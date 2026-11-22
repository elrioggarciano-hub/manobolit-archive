// Learned word translations — IBM Model 1 statistical word alignment (Brown et al., 1993).
// Trained with Expectation-Maximization on the parallel texts of human-verified archive entries
// (Manobo transcription ↔ English / Bisaya translation), seeded with the verified lexicon pairs.
// No translations are written in code: everything here is learned from the database contents.
// Held-out test on the 22-entry archive (2026-11-22, 3-fold over dictionary words seen in the texts):
// Manobo→Bisaya pairs with p ≥ 0.5 were 70% correct (7/10); with p ≥ 0.3, 48% (11/23).

export type AlignDirection = 'msm->en' | 'msm->ceb' | 'en->msm' | 'ceb->msm'
export const ALIGN_DIRECTIONS: AlignDirection[] = ['msm->en', 'msm->ceb', 'en->msm', 'ceb->msm']

/** Minimum learned probability for a word to be used in a translation (labelled as learned). */
export const LEARNED_MIN_PROBABILITY = 0.5
/** Minimum probability for a learned pair to be suggested to admins for review. */
export const SUGGESTION_MIN_PROBABILITY = 0.3

export interface LearnedTranslation {
  target: string
  probability: number
}

/** source word → best learned target words (highest probability first) */
export type AlignmentTable = Map<string, LearnedTranslation[]>

export interface AlignmentModels {
  tables: Record<AlignDirection, AlignmentTable>
  trainedDocuments: number
  seedPairs: number
  /** source-word frequency in the parallel texts (evidence for suggestions) */
  sourceFrequency: Record<AlignDirection, Map<string, number>>
}

const TOKEN_RE = /[\p{L}]+(?:['-][\p{L}]+)*/gu
export function alignmentTokens(text: string | null | undefined): string[] {
  return (text || '').toLowerCase().match(TOKEN_RE) || []
}

/**
 * IBM Model 1 EM training. pairs = [sourceTokens, targetTokens][].
 * Returns for each source word its top-3 target words with t(target | source).
 */
export function trainIbm1(pairs: [string[], string[]][], iterations = 15): AlignmentTable {
  // Integer-encode the vocabularies so the EM loops work on numbers (fast enough for serverless).
  const srcIds = new Map<string, number>()
  const tgtIds = new Map<string, number>()
  const srcWords: string[] = []
  const tgtWords: string[] = []
  const id = (m: Map<string, number>, words: string[], w: string) => {
    let i = m.get(w)
    if (i === undefined) {
      i = words.length
      m.set(w, i)
      words.push(w)
    }
    return i
  }
  const enc = pairs.map(([s, t]) => [Int32Array.from(s, w => id(srcIds, srcWords, w)), Int32Array.from(t, w => id(tgtIds, tgtWords, w))] as const)
  const E = tgtWords.length || 1

  // Sparse t(e|f): only co-occurring (f, e) pairs, keyed by f * E + e, uniform initialisation.
  const keyOf = new Map<number, number>()
  for (const [src, tgt] of enc) for (const f of src) for (const e of tgt) {
    const k = f * E + e
    if (!keyOf.has(k)) keyOf.set(k, keyOf.size)
  }
  const nKeys = keyOf.size
  // Pre-resolve slot indices per pair so the EM loop does no map lookups.
  const slots = enc.map(([src, tgt]) => {
    const arr = new Int32Array(src.length * tgt.length)
    let n = 0
    for (const e of tgt) for (const f of src) arr[n++] = keyOf.get(f * E + e)!
    return arr
  })
  const slotSrc = new Int32Array(nKeys)
  for (const [k, slot] of keyOf) slotSrc[slot] = Math.floor(k / E)

  let t = new Float64Array(nKeys).fill(1 / E)
  const count = new Float64Array(nKeys)
  const total = new Float64Array(srcWords.length)
  for (let it = 0; it < iterations; it++) {
    count.fill(0)
    total.fill(0)
    enc.forEach(([src, tgt], p) => {
      const sl = slots[p]
      const S = src.length
      for (let j = 0; j < tgt.length; j++) {
        let z = 0
        for (let i = 0; i < S; i++) z += t[sl[j * S + i]]
        if (z <= 0) continue
        for (let i = 0; i < S; i++) {
          const slot = sl[j * S + i]
          const c = t[slot] / z
          count[slot] += c
          total[src[i]] += c
        }
      }
    })
    const next = new Float64Array(nKeys)
    for (let s = 0; s < nKeys; s++) next[s] = total[slotSrc[s]] > 0 ? count[s] / total[slotSrc[s]] : 0
    t = next
  }

  const table: AlignmentTable = new Map()
  for (const [k, slot] of keyOf) {
    const f = srcWords[Math.floor(k / E)]
    const list = table.get(f) || []
    list.push({ target: tgtWords[k % E], probability: t[slot] })
    table.set(f, list)
  }
  for (const [f, list] of table) {
    table.set(
      f,
      list
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3)
        .map(x => ({ target: x.target, probability: Math.round(x.probability * 1000) / 1000 }))
    )
  }
  return table
}

export interface ParallelRecord {
  transcription?: string | null
  translation?: string | null
  bisayaTranslation?: string | null
}

export interface SeedPair {
  manobo: string
  english?: string | null
  bisaya?: string | null
}

/** Trains all four directions from verified archive texts plus verified lexicon seed pairs. */
export function buildAlignmentModels(records: ParallelRecord[], seeds: SeedPair[]): AlignmentModels {
  const docs = {
    en: [] as [string[], string[]][],
    ceb: [] as [string[], string[]][],
  }
  for (const r of records) {
    const msm = alignmentTokens(r.transcription)
    if (!msm.length) continue
    for (const [lang, text] of [['en', r.translation], ['ceb', r.bisayaTranslation]] as const) {
      const other = alignmentTokens(text)
      // skip pairs whose lengths are too different to be translations of each other (e.g. title-only)
      if (other.length && msm.length / other.length >= 1 / 3 && msm.length / other.length <= 3) docs[lang].push([msm, other])
    }
  }

  const single = (s?: string | null) => {
    const first = (s || '').toLowerCase().split(' / ')[0].split(' (')[0].trim()
    return first && !/\s/.test(first) ? first : null
  }
  const seedPairs = { en: [] as [string[], string[]][], ceb: [] as [string[], string[]][] }
  for (const s of seeds) {
    const m = single(s.manobo)
    if (!m) continue
    const en = single(s.english)
    const ceb = single(s.bisaya)
    if (en) seedPairs.en.push([[m], [en]])
    if (ceb) seedPairs.ceb.push([[m], [ceb]])
  }

  const flip = (ps: [string[], string[]][]) => ps.map(([a, b]) => [b, a] as [string[], string[]])
  const freq = (ps: [string[], string[]][]) => {
    const m = new Map<string, number>()
    for (const [src] of ps) for (const w of src) m.set(w, (m.get(w) || 0) + 1)
    return m
  }

  const train = {
    'msm->en': [...docs.en, ...seedPairs.en],
    'msm->ceb': [...docs.ceb, ...seedPairs.ceb],
    'en->msm': flip([...docs.en, ...seedPairs.en]),
    'ceb->msm': flip([...docs.ceb, ...seedPairs.ceb]),
  } as Record<AlignDirection, [string[], string[]][]>

  const tables = {} as Record<AlignDirection, AlignmentTable>
  const sourceFrequency = {} as Record<AlignDirection, Map<string, number>>
  for (const d of ALIGN_DIRECTIONS) {
    tables[d] = trainIbm1(train[d])
    sourceFrequency[d] = freq(d.startsWith('msm') ? docs[d.slice(5) as 'en' | 'ceb'] : flip(docs[d.slice(0, d.indexOf('-')) as 'en' | 'ceb']))
  }
  return {
    tables,
    trainedDocuments: docs.en.length + docs.ceb.length,
    seedPairs: seedPairs.en.length + seedPairs.ceb.length,
    sourceFrequency,
  }
}

/**
 * Directions reliable enough to use automatically in translations. Held-out test (2026-11-22):
 * Manobo↔Bisaya learned pairs were mostly correct; Manobo↔English were not (too little data, more distant
 * languages), so English pairs are only offered to reviewers as suggestions.
 */
export const AUTO_USE_DIRECTIONS = new Set<AlignDirection>(['msm->ceb', 'ceb->msm'])

/** Best learned translation of a word if it is confident enough to use. */
export function learnedTranslation(
  models: AlignmentModels | null | undefined,
  source: 'en' | 'msm' | 'ceb',
  target: 'en' | 'msm' | 'ceb',
  word: string,
  minProbability = LEARNED_MIN_PROBABILITY
): LearnedTranslation | null {
  if (!models) return null
  const dir = `${source}->${target}` as AlignDirection
  if (!AUTO_USE_DIRECTIONS.has(dir)) return null
  const best = models.tables[dir]?.get(word.toLowerCase())?.[0]
  return best && best.probability >= minProbability ? best : null
}
