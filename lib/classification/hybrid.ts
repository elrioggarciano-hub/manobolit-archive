// Unified Multi-Tier Classification Architecture:
// 1. Supervised Machine Learning: Multinomial Naive Bayes (Laplace alpha = 1.0)
// 2. Character N-Gram TF-IDF Centroid Model (3-5-grams per word with boundary markers)
// 3. Statistical Information Retrieval: Word-Level TF-IDF Vector Space Model (VSM)
// 4. Dialect-Aware Orthographic Matching: Levenshtein + Dice Variants
// 5. Domain Rules: Eugenio (1993) & Andress (1985) Taxonomies

import { classifyWithVSM, VSMResult, FeatureWeight, TfidfModel } from './tfidf'
import { findOrthographicDialectMatches, FuzzyMatchResult } from './fuzzy'
import { tokenizeUnigrams } from './tokenizer'
import { genreRules, themeRules, locationRules, ClassificationRule, RulesProfile, RULES_PROFILE, isExcludedByProfile } from './rules'
import { MatchedTerm, RuleDetail } from './engine'
import { predictNaiveBayes, NaiveBayesPrediction, NaiveBayesModel } from './naiveBayes'
import { classifyWithCharNgram, CharNgramResult, CharNgramModel } from './charNgram'
import { ACTIVE_GENRES } from './trainingCorpus'
import { cleanClassificationText } from './textCleaning'

export interface InjectableModels {
  nb?: NaiveBayesModel
  tfidf?: TfidfModel
  charNgram?: CharNgramModel
  rulesProfile?: RulesProfile
}

export type AlgorithmMode =
  | 'HYBRID_ENSEMBLE'
  | 'NAIVE_BAYES_ML'
  | 'CHAR_NGRAM'
  | 'TF_IDF_VSM'
  | 'RULE_BASED'

export interface ModelScoreBreakdown {
  naiveBayesProbability: number
  charNgramSimilarity: number
  vsmCosineSimilarity: number
  ruleConfidence: number
  fuzzyOrthographicScore: number
  ensembleConfidence: number
}

export interface HybridClassificationResult {
  algorithmMode: AlgorithmMode
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
  ruleDetails: Record<string, RuleDetail>

  algorithmicBreakdown: {
    naiveBayes: NaiveBayesPrediction
    charNgram: CharNgramResult
    vsm: VSMResult
    fuzzyMatches: FuzzyMatchResult[]
    topFeatures: FeatureWeight[]
    scoreBreakdown: ModelScoreBreakdown
    mathematicalExplanation: string
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const termRegexCache = new Map<string, RegExp>()
function getTermBoundaryRegex(term: string): RegExp {
  const t = term.trim().toLowerCase()
  let rx = termRegexCache.get(t)
  if (!rx) {
    rx = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(t)}(?![\\p{L}\\p{N}])`, 'iu')
    termRegexCache.set(t, rx)
  }
  return rx
}

/**
 * Matches a term strictly within Unicode word boundaries.
 * Prevents substring false positives (e.g., 'sing' matching in 'crossing' or 'uling' in 'ruling').
 */
export function matchWordBoundary(text: string, term: string): boolean {
  const t = term.trim()
  if (!t) return false
  return getTermBoundaryRegex(t).test(text)
}

/**
 * Rule-Scoring function with Unicode word-boundary matching and configurable profile.
 */
export function scoreRule(
  rule: ClassificationRule,
  normalizedText: string,
  profile: RulesProfile = RULES_PROFILE
): RuleDetail {
  let score = 0
  let matchCount = 0
  const matched: MatchedTerm[] = []

  const checkTerm = (term: string, type: 'keyword' | 'phrase' | 'context', weight: number) => {
    const trimmed = term.trim()
    if (!trimmed) return
    if (profile === 'framework-only' && isExcludedByProfile(trimmed, profile)) {
      return
    }
    if (matchWordBoundary(normalizedText, trimmed)) {
      score += weight
      matchCount++
      matched.push({ term: trimmed, type })
    }
  }

  for (const keyword of rule.keywords) {
    checkTerm(keyword, 'keyword', 1)
  }

  for (const phrase of rule.phrases) {
    checkTerm(phrase, 'phrase', 2)
  }

  for (const clue of rule.contextClues) {
    checkTerm(clue, 'context', 1.5)
  }

  matched.sort((a, b) => {
    const rank = { phrase: 0, context: 1, keyword: 2 }
    return rank[a.type] - rank[b.type]
  })

  if (matchCount === 0) return { confidence: 0, matched: [] }

  const targetSaturation = 2.5
  const rawRatio = Math.min(score / targetSaturation, 1.0)
  const scaled = rawRatio * rule.baseConfidence

  return { confidence: Math.round(scaled * 100) / 100, matched }
}

/**
 * Classifies an entry using the selected Algorithm Mode:
 * - 'NAIVE_BAYES_ML': 100% Supervised Machine Learning (Laplace-smoothed Multinomial Naive Bayes)
 * - 'CHAR_NGRAM': Character 3-5-Gram TF-IDF Centroid Model
 * - 'HYBRID_ENSEMBLE': 40% Naive Bayes ML + 25% TF-IDF VSM + 20% Char N-Gram + 15% Rules
 * - 'TF_IDF_VSM': Statistical Information Retrieval Vector Space Model
 * - 'RULE_BASED': Domain Rule-Based System
 */
export function classifyHybrid(
  fullText: string,
  targetGenreFilter: string = 'ALL',
  algorithmMode: AlgorithmMode = 'HYBRID_ENSEMBLE',
  models?: InjectableModels,
  locationInput?: string
): HybridClassificationResult {
  const normText = cleanClassificationText(fullText).toLowerCase()
  const unigrams = tokenizeUnigrams(normText, false)
  const activeProfile = models?.rulesProfile ?? RULES_PROFILE

  // 1. Run Supervised Machine Learning: Multinomial Naive Bayes
  const nbResult = predictNaiveBayes(normText, targetGenreFilter, models?.nb)

  // 2. Run Character N-Gram TF-IDF Centroid Model (3-5-grams per word with boundary markers)
  const charNgramResult = classifyWithCharNgram(normText, targetGenreFilter, models?.charNgram)

  // 3. Run Statistical Information Retrieval: TF-IDF Vector Space Model
  const vsmResult = classifyWithVSM(normText, targetGenreFilter, models?.tfidf)

  // 4. Run Dialect-Aware Fuzzy Orthographic Matcher (Levenshtein + Dice)
  const fuzzyMatches = findOrthographicDialectMatches(unigrams, 0.78)
  const fuzzyScore = fuzzyMatches.length > 0
    ? Math.min(1.0, fuzzyMatches.reduce((acc, m) => acc + m.similarity * 0.35, 0))
    : 0.0

  // 5. Run Heuristic Rule Engine
  const activeGenreSet = new Set<string>(ACTIVE_GENRES)
  const ruleDetails: Record<string, RuleDetail> = {}
  const genreScoresRule: { genre: string; confidence: number; ruleId: string }[] = []

  for (const rule of genreRules) {
    if (targetGenreFilter === 'ALL') {
      if (!activeGenreSet.has(rule.value)) continue
    } else if (rule.value !== targetGenreFilter) {
      continue
    }
    const detail = scoreRule(rule, normText, activeProfile)
    ruleDetails[rule.id] = detail
    if (detail.confidence > 0) {
      genreScoresRule.push({ genre: rule.value, confidence: detail.confidence, ruleId: rule.id })
    }
  }

  genreScoresRule.sort((a, b) => b.confidence - a.confidence)

  // --- Theme Classification ---
  // Requirement: Theme confidence threshold requires >= 2 distinct matched terms (not 1)
  const themeResults: { value: string; confidence: number; ruleId: string }[] = []
  for (const rule of themeRules) {
    const detail = scoreRule(rule, normText, activeProfile)
    ruleDetails[rule.id] = detail
    const distinctTerms = new Set(detail.matched.map(m => m.term.toLowerCase()))
    if (distinctTerms.size >= 2 && detail.confidence >= 0.12) {
      themeResults.push({ value: rule.value, confidence: detail.confidence, ruleId: rule.id })
    }
  }
  themeResults.sort((a, b) => b.confidence - a.confidence)
  const topThemes = themeResults.slice(0, 4)

  // --- Location Classification ---
  // Requirement: Remove location inference from content; location must come strictly from recorded communityLocation
  const locationResults: { value: string; confidence: number; ruleId: string }[] = []
  if (locationInput && locationInput.trim()) {
    const normLoc = locationInput.toLowerCase()
    for (const rule of locationRules) {
      const detail = scoreRule(rule, normLoc, 'full')
      ruleDetails[rule.id] = detail
      if (detail.confidence >= 0.08) {
        locationResults.push({ value: rule.value, confidence: detail.confidence, ruleId: rule.id })
      }
    }
  }
  locationResults.sort((a, b) => b.confidence - a.confidence)
  const topLocation = locationResults[0] ?? null

  // 6. Synthesize Scores according to the selected Algorithm Mode
  const candidateGenres = targetGenreFilter === 'ALL'
    ? (ACTIVE_GENRES as readonly string[])
    : [targetGenreFilter]

  const finalGenreScores: { genre: string; confidence: number; ruleId: string }[] = []

  for (const genre of candidateGenres) {
    const ruleMatch = genreScoresRule.find(s => s.genre === genre)
    const ruleConf = ruleMatch ? ruleMatch.confidence : 0
    const ruleId = ruleMatch ? ruleMatch.ruleId : (genreRules.find(r => r.value === genre)?.id || 'G001')

    const vsmMatch = vsmResult.allGenreScores.find(s => s.category === genre)
    const vsmSim = vsmMatch ? vsmMatch.cosineSimilarity : 0

    const nbMatch = nbResult.allProbabilities.find(s => s.genre === genre)
    const nbProb = nbMatch ? nbMatch.probability : 0

    const charNgramMatch = charNgramResult.allGenreScores.find(s => s.genre === genre)
    const charSim = charNgramMatch ? charNgramMatch.similarity : 0

    let combinedScore = 0

    if (algorithmMode === 'RULE_BASED') {
      combinedScore = ruleConf
    } else if (algorithmMode === 'TF_IDF_VSM') {
      combinedScore = vsmSim
    } else if (algorithmMode === 'NAIVE_BAYES_ML') {
      // 100% Supervised Machine Learning Posterior Probability
      combinedScore = nbProb
    } else if (algorithmMode === 'CHAR_NGRAM') {
      // Character 3-5-Gram Centroid Cosine Similarity
      combinedScore = charSim
    } else {
      // 'HYBRID_ENSEMBLE'
      // INTERIM hybrid weights (NOT tuned, replaced in Step 6):
      // NB 0.40, TF-IDF 0.25, CHAR_NGRAM 0.20 (neural's old slot), Rules 0.15.
      const genreFuzzyBonus = fuzzyMatches.some(f => f.category === 'GENRE') ? fuzzyScore * 0.15 : 0
      combinedScore =
        (0.40 * nbProb) +
        (0.25 * vsmSim) +
        (0.20 * charSim) +
        (0.15 * ruleConf) +
        genreFuzzyBonus

      combinedScore = Math.min(1.0, combinedScore)
    }

    finalGenreScores.push({
      genre,
      confidence: Math.round(combinedScore * 100) / 100,
      ruleId,
    })
  }

  finalGenreScores.sort((a, b) => b.confidence - a.confidence)

  const topGenre = finalGenreScores[0] || {
    genre: targetGenreFilter !== 'ALL' ? targetGenreFilter : (ACTIVE_GENRES[0] || 'RIDDLE'),
    confidence: 0,
    ruleId: 'G001',
  }

  const appliedGenreRuleIds = finalGenreScores
    .filter(s => s.confidence > 0.05)
    .map(s => s.ruleId)

  const allRulesApplied = [
    ...appliedGenreRuleIds,
    ...topThemes.map(t => t.ruleId),
    ...(topLocation ? [topLocation.ruleId] : []),
  ]

  const ruleMatchForTop = genreScoresRule.find(s => s.genre === topGenre.genre)
  const vsmMatchForTop = vsmResult.allGenreScores.find(s => s.category === topGenre.genre)
  const nbMatchForTop = nbResult.allProbabilities.find(s => s.genre === topGenre.genre)
  const charNgramMatchForTop = charNgramResult.allGenreScores.find(s => s.genre === topGenre.genre)

  const scoreBreakdown: ModelScoreBreakdown = {
    naiveBayesProbability: nbMatchForTop ? nbMatchForTop.probability : 0,
    charNgramSimilarity: charNgramMatchForTop ? charNgramMatchForTop.similarity : 0,
    vsmCosineSimilarity: vsmMatchForTop ? vsmMatchForTop.cosineSimilarity : 0,
    ruleConfidence: ruleMatchForTop ? ruleMatchForTop.confidence : 0,
    fuzzyOrthographicScore: Math.round(fuzzyScore * 100) / 100,
    ensembleConfidence: topGenre.confidence,
  }

  let mathExplanation = ''
  if (algorithmMode === 'NAIVE_BAYES_ML') {
    mathExplanation = `Supervised ML Inference: P(${topGenre.genre}|d) = ${(scoreBreakdown.naiveBayesProbability * 100).toFixed(1)}% via Multinomial Naive Bayes (Laplace α=1.0, |V|=${nbResult.modelMetadata.vocabularySize}, N=${nbResult.modelMetadata.trainedSampleCount} training records).`
  } else if (algorithmMode === 'CHAR_NGRAM') {
    mathExplanation = `Character N-Gram VSM: Cosine alignment = ${(scoreBreakdown.charNgramSimilarity * 100).toFixed(1)}% between Word-Bounded 3-5-Gram Vector and ${topGenre.genre} Centroid Vector.`
  } else if (algorithmMode === 'HYBRID_ENSEMBLE') {
    mathExplanation = `Hybrid Model = (0.40 × Naive Bayes: ${scoreBreakdown.naiveBayesProbability.toFixed(2)}) + (0.25 × Word TF-IDF: ${scoreBreakdown.vsmCosineSimilarity.toFixed(2)}) + (0.20 × Char N-gram: ${scoreBreakdown.charNgramSimilarity.toFixed(2)}) + (0.15 × Rules: ${scoreBreakdown.ruleConfidence.toFixed(2)}) = ${(topGenre.confidence * 100).toFixed(0)}%`
  } else if (algorithmMode === 'TF_IDF_VSM') {
    mathExplanation = `VSM Cosine Similarity Angle: cos(θ) = ${(scoreBreakdown.vsmCosineSimilarity * 100).toFixed(1)}% between Document Vector (||d||=${vsmResult.documentVectorMagnitude}) and ${topGenre.genre} Centroid Vector.`
  } else {
    const profileLabel = activeProfile === 'full' ? 'full (in-sample)' : 'framework-only'
    mathExplanation = `Domain Rule Pattern Matching [${profileLabel}]: Word-boundary taxonomic indicators evaluated against Eugenio (1993) definitions.`
  }

  return {
    algorithmMode,
    genre: {
      value: topGenre.genre,
      confidence: topGenre.confidence,
      rulesApplied: appliedGenreRuleIds,
      allScores: finalGenreScores.map(s => ({ genre: s.genre, confidence: s.confidence })),
    },
    themes: topThemes,
    location: topLocation,
    rulesApplied: allRulesApplied,
    overallConfidence: topGenre.confidence,
    ruleDetails,
    algorithmicBreakdown: {
      naiveBayes: nbResult,
      charNgram: charNgramResult,
      vsm: vsmResult,
      fuzzyMatches,
      topFeatures: vsmResult.extractedFeatures,
      scoreBreakdown,
      mathematicalExplanation: mathExplanation,
    },
  }
}
