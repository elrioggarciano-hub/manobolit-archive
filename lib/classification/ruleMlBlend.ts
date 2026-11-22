// Rule-based + machine-learning decision.
// final(genre) = RULE_WEIGHT × rule score (Eugenio/Andress rules, softmax-normalised)
//              + (1 − RULE_WEIGHT) × probability from the Colab-trained model.
// LOOCV on the 22-entry archive (2026-11-22): rules alone 77.3%, trained model alone 72.7%,
// combined 90.9% (identical for rule weights 0.3 / 0.5 / 0.7); with the 0.35 abstention threshold the
// system answered 77% of entries, all correctly, and sent the rest to human review.

import { RULE_WEIGHT } from './hybrid'

export interface BlendResult {
  genre: string
  confidence: number
  isUnclassified: boolean
  distribution: { genre: string; confidence: number }[]
}

export function blendRulesWithModel(
  ruleScores: { genre: string; confidence: number }[],
  modelProbabilities: { genre: string; probability: number }[],
  unclassifiedThreshold: number,
  ruleWeight: number = RULE_WEIGHT
): BlendResult {
  const genres = Array.from(new Set([...modelProbabilities.map(p => p.genre), ...ruleScores.map(r => r.genre)]))
  const rule = new Map(ruleScores.map(r => [r.genre, r.confidence]))
  const model = new Map(modelProbabilities.map(p => [p.genre, p.probability]))
  const distribution = genres
    .map(genre => ({
      genre,
      confidence: Math.round((ruleWeight * (rule.get(genre) ?? 0) + (1 - ruleWeight) * (model.get(genre) ?? 0)) * 1000) / 1000,
    }))
    .sort((a, b) => b.confidence - a.confidence)
  const top = distribution[0] ?? { genre: 'UNCLASSIFIED', confidence: 0 }
  const isUnclassified = top.confidence < unclassifiedThreshold
  return { genre: isUnclassified ? 'UNCLASSIFIED' : top.genre, confidence: top.confidence, isUnclassified, distribution }
}
