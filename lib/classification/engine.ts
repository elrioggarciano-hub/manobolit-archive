import { ClassificationRule } from './rules'
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
    isUnclassified?: boolean
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
  communityLocation?: string | null
  municipality?: string | null
  barangay?: string | null
  province?: string | null
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
 *
 * Location policy: Inferred strictly from recorded communityLocation provenance metadata,
 * never hallucinated from oral story text.
 */
export function classifyEntry(
  input: string | EntryLike,
  additionalContext: string = '',
  genreFilter: string = 'ALL',
  algorithmMode: AlgorithmMode = 'HYBRID_ENSEMBLE',
  models?: InjectableModels
): ClassificationResult {
  let rawText: string
  let locationInput: string | undefined

  if (typeof input === 'object' && input !== null) {
    const rawJoined = [
      input.title,
      input.manoboTitle,
      input.englishTitle,
      input.transcription,
      input.translation,
      additionalContext,
    ].filter(Boolean).join(' ')
    const cleaned = cleanClassificationText(rawJoined)
    rawText = baseNormalize(cleaned)

    const locParts = [
      input.communityLocation,
      input.barangay,
      input.municipality,
      input.province,
    ].filter(Boolean)
    if (locParts.length > 0) {
      locationInput = locParts.join(', ')
    }
  } else {
    const cleaned = cleanClassificationText(`${input} ${additionalContext}`)
    rawText = baseNormalize(cleaned)
  }

  // Execute Hybrid Classifier (ignoring targetGenreFilter in the classification path)
  return classifyHybrid(rawText, 'ALL', algorithmMode, models, locationInput)
}
