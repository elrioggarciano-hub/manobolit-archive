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

export const UNCLASSIFIED_THRESHOLD = 0.35
export const UNCLASSIFIED_MARGIN = 0.05

/**
 * Converts raw non-negative model scores to a calibrated probability distribution using Softmax.
 */
export function softmaxDistribution(scores: number[], temperature: number = 0.25): number[] {
  const max = Math.max(...scores)
  const exps = scores.map(s => Math.exp((s - max) / temperature))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => (sum > 0 ? e / sum : 1 / scores.length))
}

export interface ModelScoreBreakdown {
  naiveBayesProbability: number
  charNgramSimilarity: number
  vsmCosineSimilarity: number
  ruleConfidence: number
  fuzzyOrthographicScore: number
  ensembleConfidence: number
  unclassifiedThreshold: number
  unclassifiedMargin: number
  isUnclassified: boolean
}

export interface HybridClassificationResult {
  algorithmMode: AlgorithmMode
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
    if (profile !== 'full' && isExcludedByProfile(trimmed, profile)) {
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
  // Requirement: Theme threshold requires >= 2 distinct terms AFTER deduplication.
  // If a matched keyword is a substring of a matched phrase in the same rule, count only the phrase.
  const themeResults: { value: string; confidence: number; ruleId: string }[] = []
  for (const rule of themeRules) {
    const detail = scoreRule(rule, normText, activeProfile)
    ruleDetails[rule.id] = detail

    const matchedPhrases = detail.matched.filter(m => m.type === 'phrase').map(m => m.term.toLowerCase())
    const dedupedTerms: string[] = []

    for (const m of detail.matched) {
      const termLower = m.term.toLowerCase()
      if (m.type === 'keyword') {
        const isSubsumed = matchedPhrases.some(phrase => phrase.includes(termLower) && phrase !== termLower)
        if (isSubsumed) continue
      }
      dedupedTerms.push(termLower)
    }

    const distinctTerms = new Set(dedupedTerms)
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
  // TargetGenreFilter is removed from classification path (model evaluates across all ACTIVE_GENRES)
  const candidateGenres = ACTIVE_GENRES as readonly string[]

  // Convert each model's outputs across ACTIVE_GENRES into calibrated probability distributions
  const rawVsmScores = candidateGenres.map(g => {
    const m = vsmResult.allGenreScores.find(s => s.category === g)
    return m ? m.cosineSimilarity : 0
  })
  const rawCharScores = candidateGenres.map(g => {
    const m = charNgramResult.allGenreScores.find(s => s.genre === g)
    return m ? m.similarity : 0
  })
  const rawRuleScores = candidateGenres.map(g => {
    const m = genreScoresRule.find(s => s.genre === g)
    return m ? m.confidence : 0
  })

  // Softmax normalization with temperature T = 0.25 for cosine / rule score calibration
  const pVsmArr = softmaxDistribution(rawVsmScores, 0.25)
  const pCharArr = softmaxDistribution(rawCharScores, 0.25)
  const pRuleArr = softmaxDistribution(rawRuleScores, 0.25)

  const pNB: Record<string, number> = {}
  const pVSM: Record<string, number> = {}
  const pChar: Record<string, number> = {}
  const pRules: Record<string, number> = {}

  candidateGenres.forEach((genre, idx) => {
    const nbMatch = nbResult.allProbabilities.find(s => s.genre === genre)
    pNB[genre] = nbMatch ? nbMatch.probability : 1 / candidateGenres.length
    pVSM[genre] = pVsmArr[idx]
    pChar[genre] = pCharArr[idx]
    pRules[genre] = pRuleArr[idx]
  })

  const finalGenreScores: { genre: string; confidence: number; ruleId: string }[] = []

  for (const genre of candidateGenres) {
    const ruleMatch = genreScoresRule.find(s => s.genre === genre)
    const ruleId = ruleMatch ? ruleMatch.ruleId : (genreRules.find(r => r.value === genre)?.id || 'G001')

    let combinedProb = 0

    if (algorithmMode === 'RULE_BASED') {
      combinedProb = pRules[genre]
    } else if (algorithmMode === 'TF_IDF_VSM') {
      combinedProb = pVSM[genre]
    } else if (algorithmMode === 'NAIVE_BAYES_ML') {
      combinedProb = pNB[genre]
    } else if (algorithmMode === 'CHAR_NGRAM') {
      combinedProb = pChar[genre]
    } else {
      // 'HYBRID_ENSEMBLE': Default combination = equal-weight average of normalized scores
      // (Fuzzy bonus removed from probability combination to maintain calibrated probability distribution)
      combinedProb = (pNB[genre] + pVSM[genre] + pChar[genre] + pRules[genre]) / 4
    }

    finalGenreScores.push({
      genre,
      confidence: Math.round(combinedProb * 1000) / 1000,
      ruleId,
    })
  }

  finalGenreScores.sort((a, b) => b.confidence - a.confidence)

  // Abstention mechanism: UNCLASSIFIED if top score < THRESHOLD or margin to second < MARGIN
  // Special requirement: If no rule fires for any genre, RULE_BASED must return UNCLASSIFIED
  const P_1 = finalGenreScores[0]?.confidence ?? 0
  const P_2 = finalGenreScores[1]?.confidence ?? 0
  const margin = Math.round((P_1 - P_2) * 1000) / 1000

  const isRuleBasedNoFire = algorithmMode === 'RULE_BASED' && genreScoresRule.length === 0
  const isUnclassified = isRuleBasedNoFire || P_1 < UNCLASSIFIED_THRESHOLD || margin < UNCLASSIFIED_MARGIN
  const topGenreValue = isUnclassified ? 'UNCLASSIFIED' : (finalGenreScores[0]?.genre ?? 'UNCLASSIFIED')
  const topGenreConfidence = isUnclassified ? 0 : P_1

  const appliedGenreRuleIds = finalGenreScores
    .filter(s => s.confidence > 0.05)
    .map(s => s.ruleId)

  const allRulesApplied = [
    ...appliedGenreRuleIds,
    ...topThemes.map(t => t.ruleId),
    ...(topLocation ? [topLocation.ruleId] : []),
  ]

  const topGenreCandidate = finalGenreScores[0]?.genre || ACTIVE_GENRES[0]
  const ruleMatchForTop = genreScoresRule.find(s => s.genre === topGenreCandidate)
  const vsmMatchForTop = vsmResult.allGenreScores.find(s => s.category === topGenreCandidate)
  const nbMatchForTop = nbResult.allProbabilities.find(s => s.genre === topGenreCandidate)
  const charNgramMatchForTop = charNgramResult.allGenreScores.find(s => s.genre === topGenreCandidate)

  const scoreBreakdown: ModelScoreBreakdown = {
    naiveBayesProbability: nbMatchForTop ? nbMatchForTop.probability : 0,
    charNgramSimilarity: charNgramMatchForTop ? charNgramMatchForTop.similarity : 0,
    vsmCosineSimilarity: vsmMatchForTop ? vsmMatchForTop.cosineSimilarity : 0,
    ruleConfidence: ruleMatchForTop ? ruleMatchForTop.confidence : 0,
    fuzzyOrthographicScore: Math.round(fuzzyScore * 100) / 100,
    ensembleConfidence: topGenreConfidence,
    unclassifiedThreshold: UNCLASSIFIED_THRESHOLD,
    unclassifiedMargin: UNCLASSIFIED_MARGIN,
    isUnclassified,
  }

  let mathExplanation = ''
  if (algorithmMode === 'NAIVE_BAYES_ML') {
    mathExplanation = `Supervised ML Inference: P(${topGenreValue}|d) = ${(P_1 * 100).toFixed(1)}% via Multinomial Naive Bayes (Laplace α=1.0, length-normalized).`
  } else if (algorithmMode === 'CHAR_NGRAM') {
    mathExplanation = `Character N-Gram VSM: Calibrated Softmax probability = ${(P_1 * 100).toFixed(1)}% (temperature T=0.25 over 3-5-gram cosine alignment).`
  } else if (algorithmMode === 'HYBRID_ENSEMBLE') {
    mathExplanation = `Equal-Weight Ensemble = (0.25 × NB: ${(pNB[topGenreCandidate] * 100).toFixed(1)}%) + (0.25 × TF-IDF: ${(pVSM[topGenreCandidate] * 100).toFixed(1)}%) + (0.25 × Char N-gram: ${(pChar[topGenreCandidate] * 100).toFixed(1)}%) + (0.25 × Rules: ${(pRules[topGenreCandidate] * 100).toFixed(1)}%) = ${(P_1 * 100).toFixed(1)}%`
  } else if (algorithmMode === 'TF_IDF_VSM') {
    mathExplanation = `TF-IDF VSM: Calibrated Softmax probability = ${(P_1 * 100).toFixed(1)}% (temperature T=0.25 over word TF-IDF cosine alignment).`
  } else {
    const profileLabel = activeProfile === 'full' ? 'full (in-sample)' : (activeProfile === 'framework-strict' ? 'framework-strict (lower bound)' : 'framework-only')
    mathExplanation = `Domain Rule Pattern Matching [${profileLabel}]: Calibrated Softmax probability = ${(P_1 * 100).toFixed(1)}% (temperature T=0.25).`
  }

  if (isUnclassified) {
    mathExplanation += ` -> UNCLASSIFIED (top score ${(P_1 * 100).toFixed(1)}% < ${(UNCLASSIFIED_THRESHOLD * 100).toFixed(0)}% or margin ${(margin * 100).toFixed(1)}% < ${(UNCLASSIFIED_MARGIN * 100).toFixed(0)}%).`
  }

  return {
    algorithmMode,
    genre: {
      value: topGenreValue,
      confidence: topGenreConfidence,
      rulesApplied: appliedGenreRuleIds,
      allScores: finalGenreScores.map(s => ({ genre: s.genre, confidence: s.confidence })),
      isUnclassified,
    },
    themes: topThemes,
    location: topLocation,
    rulesApplied: allRulesApplied,
    overallConfidence: topGenreConfidence,
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
