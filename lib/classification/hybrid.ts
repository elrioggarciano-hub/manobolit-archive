// Unified Multi-Tier Classification Architecture:
// 1. Supervised Machine Learning: Multinomial Naive Bayes (Laplace alpha = 1.0)
// 2. Deep Learning Neural Latent Embeddings: Dense 64-D Latent Semantic Projections
// 3. Statistical Information Retrieval: TF-IDF Vector Space Model (VSM)
// 4. Dialect-Aware Computational Ethnolinguistics: Levenshtein + Dice Orthographic Matching
// 5. Domain Ontological Expert System: Eugenio (1993) & Andress (1985) Taxonomies

import { classifyWithVSM, VSMResult, FeatureWeight } from './tfidf'
import { findOrthographicDialectMatches, FuzzyMatchResult } from './fuzzy'
import { tokenizeUnigrams } from './tokenizer'
import { genreRules, themeRules, locationRules, ClassificationRule } from './rules'
import { MatchedTerm, RuleDetail } from './engine'
import { predictNaiveBayes, NaiveBayesPrediction } from './naiveBayes'
import { classifyWithNeuralSemantic, NeuralSemanticResult } from './neuralSemantic'

export type AlgorithmMode =
  | 'HYBRID_ENSEMBLE'
  | 'NAIVE_BAYES_ML'
  | 'NEURAL_SEMANTIC'
  | 'TF_IDF_VSM'
  | 'RULE_BASED'

export interface ModelScoreBreakdown {
  naiveBayesProbability: number
  neuralSemanticSimilarity: number
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

  // Algorithmic Explanations & Scientific Rigor Artifacts for Capstone Defense:
  algorithmicBreakdown: {
    naiveBayes: NaiveBayesPrediction
    neuralSemantic: NeuralSemanticResult
    vsm: VSMResult
    fuzzyMatches: FuzzyMatchResult[]
    topFeatures: FeatureWeight[]
    scoreBreakdown: ModelScoreBreakdown
    mathematicalExplanation: string
  }
}

/**
 * Baseline Rule-Scoring function (Preserved for comparison & expert system branch).
 */
function scoreRule(rule: ClassificationRule, normalizedText: string): RuleDetail {
  let score = 0
  let matchCount = 0
  const matched: MatchedTerm[] = []

  for (const keyword of rule.keywords) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      score += 1
      matchCount++
      matched.push({ term: keyword, type: 'keyword' })
    }
  }

  for (const phrase of rule.phrases) {
    if (normalizedText.includes(phrase.toLowerCase())) {
      score += 2
      matchCount++
      matched.push({ term: phrase, type: 'phrase' })
    }
  }

  for (const clue of rule.contextClues) {
    if (normalizedText.includes(clue.toLowerCase())) {
      score += 1.5
      matchCount++
      matched.push({ term: clue, type: 'context' })
    }
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
 * - 'NEURAL_SEMANTIC': Continuous 64-D Latent Semantic Projections
 * - 'HYBRID_ENSEMBLE': 40% Naive Bayes ML + 25% TF-IDF VSM + 20% Neural Semantic + 15% Rules
 * - 'TF_IDF_VSM': Statistical Information Retrieval Vector Space Model
 * - 'RULE_BASED': Legacy Heuristic Expert System
 */
export function classifyHybrid(
  fullText: string,
  targetGenreFilter: string = 'ALL',
  algorithmMode: AlgorithmMode = 'HYBRID_ENSEMBLE'
): HybridClassificationResult {
  const normText = fullText.toLowerCase()
  const unigrams = tokenizeUnigrams(normText, false)

  // 1. Run Supervised Machine Learning: Multinomial Naive Bayes
  const nbResult = predictNaiveBayes(normText, targetGenreFilter)

  // 2. Run Deep Learning Neural Semantic Projection (64-D Latent Space)
  const neuralResult = classifyWithNeuralSemantic(normText, targetGenreFilter)

  // 3. Run Statistical Information Retrieval: TF-IDF Vector Space Model
  const vsmResult = classifyWithVSM(normText, targetGenreFilter)

  // 4. Run Dialect-Aware Fuzzy Orthographic Matcher (Levenshtein + Dice)
  const fuzzyMatches = findOrthographicDialectMatches(unigrams, 0.78)
  const fuzzyScore = fuzzyMatches.length > 0
    ? Math.min(1.0, fuzzyMatches.reduce((acc, m) => acc + m.similarity * 0.35, 0))
    : 0.0

  // 5. Run Heuristic Rule Engine
  const ruleDetails: Record<string, RuleDetail> = {}
  const genreScoresRule: { genre: string; confidence: number; ruleId: string }[] = []

  for (const rule of genreRules) {
    if (targetGenreFilter !== 'ALL' && rule.value !== targetGenreFilter) continue
    const detail = scoreRule(rule, normText)
    ruleDetails[rule.id] = detail
    if (detail.confidence > 0) {
      genreScoresRule.push({ genre: rule.value, confidence: detail.confidence, ruleId: rule.id })
    }
  }

  genreScoresRule.sort((a, b) => b.confidence - a.confidence)

  // --- Theme Classification ---
  const themeResults: { value: string; confidence: number; ruleId: string }[] = []
  for (const rule of themeRules) {
    const detail = scoreRule(rule, normText)
    ruleDetails[rule.id] = detail
    if (detail.confidence >= 0.12) {
      themeResults.push({ value: rule.value, confidence: detail.confidence, ruleId: rule.id })
    }
  }
  themeResults.sort((a, b) => b.confidence - a.confidence)
  const topThemes = themeResults.slice(0, 4)

  // --- Location Classification ---
  const locationResults: { value: string; confidence: number; ruleId: string }[] = []
  for (const rule of locationRules) {
    const detail = scoreRule(rule, normText)
    ruleDetails[rule.id] = detail
    if (detail.confidence >= 0.08) {
      locationResults.push({ value: rule.value, confidence: detail.confidence, ruleId: rule.id })
    }
  }
  locationResults.sort((a, b) => b.confidence - a.confidence)
  const topLocation = locationResults[0] ?? null

  // 6. Synthesize Scores according to the selected Algorithm Mode
  const allGenres = Array.from(new Set(genreRules.map(r => r.value)))
  const candidateGenres = targetGenreFilter === 'ALL' ? allGenres : [targetGenreFilter]

  const finalGenreScores: { genre: string; confidence: number; ruleId: string }[] = []

  for (const genre of candidateGenres) {
    const ruleMatch = genreScoresRule.find(s => s.genre === genre)
    const ruleConf = ruleMatch ? ruleMatch.confidence : 0
    const ruleId = ruleMatch ? ruleMatch.ruleId : (genreRules.find(r => r.value === genre)?.id || 'G001')

    const vsmMatch = vsmResult.allGenreScores.find(s => s.category === genre)
    const vsmSim = vsmMatch ? vsmMatch.cosineSimilarity : 0

    const nbMatch = nbResult.allProbabilities.find(s => s.genre === genre)
    const nbProb = nbMatch ? nbMatch.probability : 0

    const neuralMatch = neuralResult.allGenreScores.find(s => s.genre === genre)
    const neuralSim = neuralMatch ? neuralMatch.similarity : 0

    let combinedScore = 0

    if (algorithmMode === 'RULE_BASED') {
      combinedScore = ruleConf
    } else if (algorithmMode === 'TF_IDF_VSM') {
      combinedScore = vsmSim
    } else if (algorithmMode === 'NAIVE_BAYES_ML') {
      // 100% Supervised Machine Learning Posterior Probability
      combinedScore = nbProb
    } else if (algorithmMode === 'NEURAL_SEMANTIC') {
      // Deep Learning Continuous Latent Space Cosine Similarity
      combinedScore = neuralSim
    } else {
      // 'HYBRID_ENSEMBLE'
      // Multi-layer weighting: 40% Naive Bayes ML + 25% TF-IDF VSM + 20% Neural Semantic + 15% Rules
      const genreFuzzyBonus = fuzzyMatches.some(f => f.category === 'GENRE') ? fuzzyScore * 0.15 : 0
      combinedScore =
        (0.40 * nbProb) +
        (0.25 * vsmSim) +
        (0.20 * neuralSim) +
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
    genre: targetGenreFilter !== 'ALL' ? targetGenreFilter : 'MYTH',
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
  const neuralMatchForTop = neuralResult.allGenreScores.find(s => s.genre === topGenre.genre)

  const scoreBreakdown: ModelScoreBreakdown = {
    naiveBayesProbability: nbMatchForTop ? nbMatchForTop.probability : 0,
    neuralSemanticSimilarity: neuralMatchForTop ? neuralMatchForTop.similarity : 0,
    vsmCosineSimilarity: vsmMatchForTop ? vsmMatchForTop.cosineSimilarity : 0,
    ruleConfidence: ruleMatchForTop ? ruleMatchForTop.confidence : 0,
    fuzzyOrthographicScore: Math.round(fuzzyScore * 100) / 100,
    ensembleConfidence: topGenre.confidence,
  }

  let mathExplanation = ''
  if (algorithmMode === 'NAIVE_BAYES_ML') {
    mathExplanation = `Supervised ML Inference: P(${topGenre.genre}|d) = ${(scoreBreakdown.naiveBayesProbability * 100).toFixed(1)}% via Multinomial Naive Bayes (Laplace α=1.0, |V|=${nbResult.modelMetadata.vocabularySize}, N=${nbResult.modelMetadata.trainedSampleCount} training records).`
  } else if (algorithmMode === 'NEURAL_SEMANTIC') {
    mathExplanation = `Deep Learning Latent Projection: Cosine alignment = ${(scoreBreakdown.neuralSemanticSimilarity * 100).toFixed(1)}% in 64-D Continuous Dense Semantic Subspace (${neuralResult.semanticClusterName}).`
  } else if (algorithmMode === 'HYBRID_ENSEMBLE') {
    mathExplanation = `Hybrid Quad-Model = (0.40 × Naive Bayes: ${scoreBreakdown.naiveBayesProbability.toFixed(2)}) + (0.25 × TF-IDF VSM: ${scoreBreakdown.vsmCosineSimilarity.toFixed(2)}) + (0.20 × Neural: ${scoreBreakdown.neuralSemanticSimilarity.toFixed(2)}) + (0.15 × Rules: ${scoreBreakdown.ruleConfidence.toFixed(2)}) = ${(topGenre.confidence * 100).toFixed(0)}%`
  } else if (algorithmMode === 'TF_IDF_VSM') {
    mathExplanation = `VSM Cosine Similarity Angle: cos(θ) = ${(scoreBreakdown.vsmCosineSimilarity * 100).toFixed(1)}% between Document Vector (||d||=${vsmResult.documentVectorMagnitude}) and ${topGenre.genre} Centroid Vector.`
  } else {
    mathExplanation = `Static Heuristic Pattern Matching: Saturation-scaled keyword/phrase weights against Eugenio (1993) rule triggers.`
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
      neuralSemantic: neuralResult,
      vsm: vsmResult,
      fuzzyMatches,
      topFeatures: vsmResult.extractedFeatures,
      scoreBreakdown,
      mathematicalExplanation: mathExplanation,
    },
  }
}
