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
/** A standard spelling and its documented variants (built from LexiconEntry DIALECT_VARIANT rows). */
export interface DialectVariant {
  canonical: string
  variants: string[]
  gloss: string
}

export interface FuzzyMatchResult {
  token: string
  matchedCanonical: string
  matchedVariant: string
  similarity: number
  gloss: string
}

/**
 * Scans tokens against the dialect variants stored in the lexicon database using hybrid
 * Levenshtein + Dice similarity. Returns matches above the orthographic threshold (default >= 0.78).
 */
export function findOrthographicDialectMatches(
  tokens: string[],
  dialectVariants: DialectVariant[],
  threshold: number = 0.78
): FuzzyMatchResult[] {
  const matches: FuzzyMatchResult[] = []
  const seenMatches = new Set<string>()

  for (const token of tokens) {
    if (token.length < 3) continue
    const cleanToken = token.toLowerCase()

    for (const entry of dialectVariants) {
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
            })
          }
        }
      }
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity)
}
