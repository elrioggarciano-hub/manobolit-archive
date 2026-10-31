import { genreRules, themeRules, locationRules, ClassificationRule } from './rules'
import { classifyHybrid, AlgorithmMode, HybridClassificationResult } from './hybrid'
import { normalizeText as baseNormalize } from './tokenizer'

export interface MatchedTerm {
  term: string
  type: 'keyword' | 'phrase' | 'context'
}

export interface RuleDetail {
  confidence: number
  matched: MatchedTerm[]
}

export interface ClassificationResult {
  algorithmMode?: AlgorithmMode
  genre: {
    value: string
    confidence: number
    rulesApplied: string[]
    allScores: { genre: string; confidence: number }[]
  }
  themes: {
    value: string
    confidence: number
    ruleId: string
  }[]
  location: {
    value: string
    confidence: number
    ruleId: string
  } | null
  rulesApplied: string[]
  overallConfidence: number
  /** Per-rule confidence + the specific keywords/phrases/context clues that matched, keyed by rule id. */
  ruleDetails: Record<string, RuleDetail>
  /** Scientific Rigor: Vector Space Model, TF-IDF feature weights, and dialect fuzzy breakdowns */
  algorithmicBreakdown?: HybridClassificationResult['algorithmicBreakdown']
}

export interface EntryLike {
  title?: string
  englishTitle?: string | null
  manoboTitle?: string | null
  content: string
  transcription?: string | null
  translation?: string | null
  culturalElements?: string | string[] | null
  type?: string | null
}

/**
 * Classifies literature entries across Eugenio (1993) genres, Andress (1985) themes,
 * and provenance locations using the upgraded Hybrid NLP & Vector Space Architecture.
 *
 * Defaults to 'HYBRID_ENSEMBLE' (combines 50% TF-IDF Cosine Similarity, 35% Domain Expert Rules,
 * and 15% Dialect-Aware Fuzzy Orthography).
 */
export function classifyEntry(
  input: string | EntryLike,
  additionalContext: string = '',
  genreFilter: string = 'ALL',
  algorithmMode: AlgorithmMode = 'HYBRID_ENSEMBLE'
): ClassificationResult {
  let fullText: string

  if (typeof input === 'object' && input !== null) {
    const parts = [
      input.title,
      input.englishTitle,
      input.manoboTitle,
      input.content,
      input.transcription,
      input.translation,
      typeof input.culturalElements === 'string'
        ? input.culturalElements
        : Array.isArray(input.culturalElements)
          ? input.culturalElements.join(' ')
          : '',
      input.type === 'FOLK_SONG' ? 'folk song maravilla' : '',
      additionalContext,
    ]
    fullText = baseNormalize(parts.filter(Boolean).join(' '))
  } else {
    fullText = baseNormalize(`${input} ${additionalContext}`)
  }

  // Execute Hybrid Classifier
  return classifyHybrid(fullText, genreFilter, algorithmMode)
}
