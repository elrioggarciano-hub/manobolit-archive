// Orthographic Resilience and Dialect-Aware Fuzzy Matching Engine
// Solves the unstandardized spelling and dialectal variation problem in Agusan Manobo oral literature.

import { generateCharNgrams } from './tokenizer'

/**
 * Computes standard Levenshtein Edit Distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  // Use two rows for space-efficient DP O(min(m, n))
  let prevRow = new Array(n + 1)
  let currRow = new Array(n + 1)

  for (let j = 0; j <= n; j++) prevRow[j] = j

  for (let i = 1; i <= m; i++) {
    currRow[0] = i
    const aChar = a.charAt(i - 1)
    for (let j = 1; j <= n; j++) {
      const bChar = b.charAt(j - 1)
      const cost = aChar === bChar ? 0 : 1
      currRow[j] = Math.min(
        prevRow[j] + 1,       // deletion
        currRow[j - 1] + 1,   // insertion
        prevRow[j - 1] + cost // substitution
      )
    }
    const temp = prevRow
    prevRow = currRow
    currRow = temp
  }

  return prevRow[n]
}

/**
 * Computes normalized Levenshtein Similarity in the range [0.0, 1.0].
 * 1.0 = identical string, 0.0 = completely dissimilar.
 */
export function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1.0
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1.0
  const dist = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  return Math.max(0, 1 - dist / maxLen)
}

/**
 * Computes Sørensen-Dice coefficient over character bigrams.
 * Highly robust against transposition and phoneme shifts (e.g. o/u, e/i shifts common in Manobo).
 */
export function charDiceSimilarity(a: string, b: string): number {
  const cleanA = a.toLowerCase().trim()
  const cleanB = b.toLowerCase().trim()
  if (cleanA === cleanB) return 1.0
  if (cleanA.length < 2 || cleanB.length < 2) return cleanA === cleanB ? 1.0 : 0.0

  const ngramsA = generateCharNgrams(cleanA, 2)
  const ngramsB = generateCharNgrams(cleanB, 2)

  const countsA = new Map<string, number>()
  for (const g of ngramsA) countsA.set(g, (countsA.get(g) || 0) + 1)

  let intersection = 0
  for (const g of ngramsB) {
    const c = countsA.get(g) || 0
    if (c > 0) {
      intersection++
      countsA.set(g, c - 1)
    }
  }

  return (2.0 * intersection) / (ngramsA.length + ngramsB.length)
}

/**
 * Known Agusan Manobo dialectal and orthographic variation database.
 * Demonstrates domain-specific knowledge engineering for low-resource Philippine languages.
 */
export interface DialectVariant {
  canonical: string
  variants: string[]
  gloss: string
  category: 'GENRE' | 'THEME' | 'ETHNONYM'
}

export const MANOBO_DIALECT_VARIANTS: DialectVariant[] = [
  { canonical: 'wuhig', variants: ['wohig', 'woheg', 'wahig', 'wahyg'], gloss: 'water / river / stream', category: 'THEME' },
  { canonical: 'tudtul', variants: ['tultul', 'tutul', 'todtol', 'tudtulanon'], gloss: 'folktale / oral narrative', category: 'GENRE' },
  { canonical: 'ulaging', variants: ['ulageng', 'olaging', 'ulagingan'], gloss: 'heroic epic chant', category: 'GENRE' },
  { canonical: 'sugilanon', variants: ['sigulanon', 'sogilanon', 'sugilon'], gloss: 'story / tale', category: 'GENRE' },
  { canonical: 'bituen', variants: ['bituon', 'betuen', 'bitoon'], gloss: 'stars', category: 'THEME' },
  { canonical: 'langit', variants: ['langet', 'kalangitan'], gloss: 'sky / heavens', category: 'THEME' },
  { canonical: 'tano', variants: ['tanu', 'katanoan'], gloss: 'earth / land / soil', category: 'THEME' },
  { canonical: 'diwata', variants: ['dewata', 'diyuwata', 'diwatah'], gloss: 'spirit / deity', category: 'THEME' },
  { canonical: 'kadukiliman', variants: ['kadikiluman', 'madalumon', 'maralum'], gloss: 'darkness / night', category: 'THEME' },
  { canonical: 'sinugow', variants: ['sinugaw', 'manugow', 'sinug-ow'], gloss: 'weeping / sorrow / tears', category: 'THEME' },
  { canonical: 'kapait', variants: ['kapoit', 'kapa-it'], gloss: 'hardship / bitterness', category: 'THEME' },
  { canonical: 'bayod', variants: ['balod', 'baod'], gloss: 'ocean wave', category: 'THEME' },
  { canonical: 'bubungan', variants: ['kabubunganan', 'bubung'], gloss: 'mountains / highlands', category: 'THEME' },
  { canonical: 'panaw', variants: ['panow', 'pamanaw'], gloss: 'journey / travel', category: 'THEME' },
  { canonical: 'dinaog-daog', variants: ['daog-daog', 'dinaogdaog', 'pigdaog'], gloss: 'oppressed / marginalized', category: 'THEME' },
]

export interface FuzzyMatchResult {
  token: string
  matchedCanonical: string
  matchedVariant: string
  similarity: number
  gloss: string
  category: 'GENRE' | 'THEME' | 'ETHNONYM'
}

/**
 * Scans tokens against the Manobo Dialect Variation database using hybrid Levenshtein + Dice similarity.
 * Returns matches that exceed the orthographic confidence threshold (default >= 0.78).
 */
export function findOrthographicDialectMatches(
  tokens: string[],
  threshold: number = 0.78
): FuzzyMatchResult[] {
  const matches: FuzzyMatchResult[] = []
  const seenMatches = new Set<string>()

  for (const token of tokens) {
    if (token.length < 3) continue
    const cleanToken = token.toLowerCase()

    for (const entry of MANOBO_DIALECT_VARIANTS) {
      const allTargets = [entry.canonical, ...entry.variants]
      for (const target of allTargets) {
        // Compute hybrid similarity (weighted: 50% Levenshtein, 50% Character Dice)
        const lev = levenshteinSimilarity(cleanToken, target)
        const dice = charDiceSimilarity(cleanToken, target)
        const hybridSim = (lev + dice) / 2

        if (hybridSim >= threshold) {
          const key = `${entry.canonical}-${cleanToken}`
          if (!seenMatches.has(key)) {
            seenMatches.add(key)
            matches.push({
              token: cleanToken,
              matchedCanonical: entry.canonical,
              matchedVariant: target,
              similarity: Math.round(hybridSim * 100) / 100,
              gloss: entry.gloss,
              category: entry.category,
            })
          }
        }
      }
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity)
}
