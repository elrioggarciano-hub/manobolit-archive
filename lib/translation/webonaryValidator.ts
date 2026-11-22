import { WebonaryValidationReport, WordValidation } from './types'
import { Lexicon } from './lexicon'

// SIL Webonary validation and finite-state affix decomposition.
// No dictionary data lives here: entries, dialect variants and affixes come from the
// Lexicon (LexiconEntry table, see lexiconStore.ts), passed in by the caller.

export type { WebonaryEntry } from './lexicon'

/**
 * Validates a single word against the SIL Webonary dictionary standard
 */
export function validateSingleWord(rawWord: string, lex: Lexicon): WordValidation {
  const clean = rawWord.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!clean) {
    return {
      word: rawWord,
      normalizedWord: clean,
      status: 'UNREGISTERED',
      source: 'Punctuation / Symbol',
    }
  }

  // 1. Direct match in SIL Webonary dictionary
  const directMatch = lex.webonary.find(
    (e) => e.manobo.toLowerCase() === clean || e.root.toLowerCase() === clean
  )
  if (directMatch) {
    return {
      word: rawWord,
      normalizedWord: clean,
      status: 'VERIFIED_SIL',
      partOfSpeech: directMatch.partOfSpeech,
      rootWord: directMatch.root,
      definition: directMatch.definition || `${directMatch.english} (${directMatch.bisaya})`,
      source: 'SIL Webonary (Agusan Manobo Dictionary)',
    }
  }

  // 2. Check dialect variant
  if (lex.dialectVariants[clean]) {
    const variant = lex.dialectVariants[clean]
    const standardMatch = lex.webonary.find((e) => e.manobo === variant.standard)
    return {
      word: rawWord,
      normalizedWord: clean,
      status: 'DIALECT_VARIANT',
      partOfSpeech: standardMatch?.partOfSpeech || 'VARIANT',
      rootWord: variant.standard,
      definition: standardMatch?.definition || `Dialect form of ${variant.standard}`,
      notes: variant.notes,
      source: 'SIL Webonary (Dialect Variant Standard)',
    }
  }

  // 3. Morphological Affix Decomposition (stripping Agusan Manobo affixes)
  for (const prefix of lex.prefixes) {
    if (clean.startsWith(prefix) && clean.length > prefix.length + 2) {
      const strippedRoot = clean.slice(prefix.length)
      const rootMatch = lex.webonary.find(
        (e) => e.root.toLowerCase() === strippedRoot || e.manobo.toLowerCase() === strippedRoot
      )
      if (rootMatch) {
        return {
          word: rawWord,
          normalizedWord: clean,
          status: 'AFFIXED_SIL_ROOT',
          partOfSpeech: rootMatch.partOfSpeech === 'VERB' ? 'VERB (Affixed)' : `${rootMatch.partOfSpeech} (Affixed)`,
          rootWord: rootMatch.root,
          definition: `Affixed form of root '${rootMatch.root}' (${rootMatch.english})`,
          notes: `Prefix [${prefix}-] attached to verified SIL root`,
          source: 'SIL Webonary Morphological Decomposition',
        }
      }
    }
  }

  // Also check suffix
  for (const suffix of lex.suffixes) {
    if (clean.endsWith(suffix) && clean.length > suffix.length + 2) {
      const strippedRoot = clean.slice(0, -suffix.length)
      const rootMatch = lex.webonary.find(
        (e) => e.root.toLowerCase() === strippedRoot || e.manobo.toLowerCase() === strippedRoot
      )
      if (rootMatch) {
        return {
          word: rawWord,
          normalizedWord: clean,
          status: 'AFFIXED_SIL_ROOT',
          partOfSpeech: rootMatch.partOfSpeech,
          rootWord: rootMatch.root,
          definition: `Affixed form of root '${rootMatch.root}' (${rootMatch.english})`,
          notes: `Suffix [-${suffix}] attached to verified SIL root`,
          source: 'SIL Webonary Morphological Decomposition',
        }
      }
    }
  }

  // 4. Secondary fallback: check thesis literature corpus
  const corpusMatch = lex.words.find((e) => e.manobo.toLowerCase() === clean)
  if (corpusMatch) {
    return {
      word: rawWord,
      normalizedWord: clean,
      status: 'VERIFIED_SIL',
      partOfSpeech: corpusMatch.category,
      rootWord: clean,
      definition: `${corpusMatch.english} (${corpusMatch.bisaya})`,
      notes: corpusMatch.notes || 'Documented in Agusan Manobo thesis corpus',
      source: 'Agusan Manobo Thesis Corpus (Maravilla / Catipay)',
    }
  }

  // 5. Unregistered oral word
  return {
    word: rawWord,
    normalizedWord: clean,
    status: 'UNREGISTERED',
    source: 'Oral Tradition / Uncatalogued Lexeme',
    notes: 'Candidate lexeme for field verification and dictionary expansion',
  }
}

/**
 * Validates an entire sentence or phrase against the SIL Webonary dictionary
 */
export function validateTextWithWebonary(
  text: string,
  lex: Lexicon,
  sourceLang: string = 'msm'
): WebonaryValidationReport {
  if (sourceLang !== 'msm') {
    return {
      totalTokens: 0,
      verifiedTokens: 0,
      verificationRate: 1.0,
      validatedWords: [],
      lexicalAuthority: 'SIL International Webonary (Agusan Manobo, ISO 639-3)',
      summaryNote: 'Validation is optimized for Agusan Manobo input text.',
    }
  }

  const tokens = text.trim().split(/\s+/).filter((t) => t.length > 0)
  if (tokens.length === 0) {
    return {
      totalTokens: 0,
      verifiedTokens: 0,
      verificationRate: 0,
      validatedWords: [],
      lexicalAuthority: 'SIL International Webonary (Agusan Manobo, ISO 639-3)',
      summaryNote: 'No text provided for lexical validation.',
    }
  }

  const validations: WordValidation[] = tokens.map((token) => validateSingleWord(token, lex))
  const verifiedCount = validations.filter(
    (v) => v.status === 'VERIFIED_SIL' || v.status === 'AFFIXED_SIL_ROOT' || v.status === 'DIALECT_VARIANT'
  ).length

  const rate = tokens.length > 0 ? Math.round((verifiedCount / tokens.length) * 100) / 100 : 0

  return {
    totalTokens: tokens.length,
    verifiedTokens: verifiedCount,
    verificationRate: rate,
    validatedWords: validations,
    lexicalAuthority: 'SIL International Webonary (Agusan Manobo, ISO 639-3: msm)',
    summaryNote: `${verifiedCount} of ${tokens.length} words (${Math.round(rate * 100)}%) verified against SIL Webonary standard orthography.`,
  }
}

/**
 * Searches the SIL Webonary Dictionary to supplement translations when missing from the Bible corpus.
 */
export function lookupWebonaryTranslation(
  rawWord: string,
  sourceLang: 'en' | 'msm' | 'ceb',
  targetLang: 'en' | 'msm' | 'ceb',
  lex: Lexicon
): { translation: string; source: string; notes?: string; rootWord?: string } | null {
  const clean = rawWord.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!clean) return null

  // 1. Manobo -> English or Bisaya
  if (sourceLang === 'msm') {
    const val = validateSingleWord(clean, lex)
    if (val.status !== 'UNREGISTERED') {
      const match = lex.webonary.find(
        (e) => e.manobo.toLowerCase() === val.normalizedWord || e.root.toLowerCase() === val.rootWord?.toLowerCase()
      )
      if (match) {
        const trans = targetLang === 'ceb' ? match.bisaya : match.english.split(' / ')[0].split(' (')[0]
        return {
          translation: trans,
          source: 'SIL Webonary Dictionary (ISO 639-3: msm)',
          notes: val.notes || match.definition,
          rootWord: match.root,
        }
      }
    }
    return null
  }

  // 2. English -> Manobo or Bisaya
  if (sourceLang === 'en') {
    for (const entry of lex.webonary) {
      const engTokens = entry.english.toLowerCase().split(/\s*[\/,]\s*|\s+/)
      const engPhrases = entry.english.toLowerCase().split(/\s*[\/,]\s*/)
      if (engTokens.includes(clean) || engPhrases.includes(clean)) {
        return {
          translation: targetLang === 'msm' ? entry.manobo : entry.bisaya,
          source: 'SIL Webonary Dictionary (ISO 639-3: msm)',
          notes: entry.definition || entry.english,
          rootWord: entry.root,
        }
      }
    }
    return null
  }

  // 3. Bisaya -> Manobo or English
  if (sourceLang === 'ceb') {
    for (const entry of lex.webonary) {
      const cebTokens = entry.bisaya.toLowerCase().split(/\s*[\/,]\s*|\s+/)
      const cebPhrases = entry.bisaya.toLowerCase().split(/\s*[\/,]\s*/)
      if (cebTokens.includes(clean) || cebPhrases.includes(clean)) {
        return {
          translation: targetLang === 'msm' ? entry.manobo : entry.english.split(' / ')[0],
          source: 'SIL Webonary Dictionary (ISO 639-3: msm)',
          notes: entry.definition || entry.bisaya,
          rootWord: entry.root,
        }
      }
    }
    return null
  }

  return null
}
