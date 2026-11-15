import { genreRules, themeRules, locationRules, ClassificationRule } from './rules'
import { classifyHybrid, AlgorithmMode, HybridClassificationResult, InjectableModels } from './hybrid'
import { normalizeText as baseNormalize } from './tokenizer'
import { cleanClassificationText } from './textCleaning'

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
 * and provenance locations using the Hybrid Classification Architecture.
 *
 * Combines Multinomial Naive Bayes, TF-IDF Vector Space Model, Character N-Gram Centroids,
 * and Domain Rules with Dialect-Aware Fuzzy Orthography.
 *
 * Text policy: Classifies genuine primary oral text (transcription + translation ONLY),
 * excluding modern title metadata and researcher commentary.
 */
export function classifyEntry(
  input: string | EntryLike,
  additionalContext: string = '',
  genreFilter: string = 'ALL',
  algorithmMode: AlgorithmMode = 'HYBRID_ENSEMBLE',
  models?: InjectableModels
): ClassificationResult {
  let rawText: string

  if (typeof input === 'object' && input !== null) {
    const parts = [
      input.transcription,
      input.translation,
      additionalContext,
    ]
    rawText = baseNormalize(parts.filter(Boolean).join(' '))
  } else {
    rawText = baseNormalize(`${input} ${additionalContext}`)
  }

  const fullText = cleanClassificationText(rawText)

  // Execute Hybrid Classifier
  return classifyHybrid(fullText, genreFilter, algorithmMode, models)
}
