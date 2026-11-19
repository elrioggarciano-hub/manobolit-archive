// ML Service Client and TypeScript Hybrid Classification Bridge
// Documents truthful provenance:
// The production classification engine is the in-process TypeScript Hybrid Architecture
// in lib/classification/ (Multinomial Naive Bayes + TF-IDF VSM + Char N-Gram + Domain Rules).
// The Python service in ml/ is an offline research prototype; predictions are generated
// in-process by the verified TypeScript engine.

import { classifyEntry, EntryLike } from './engine'
import { getLatestSnapshot, getActiveModels } from './retrain'

export interface MLPredictionResult {
  predictedGenre: string
  confidence: number
  probabilities: Record<string, number>
  predictionSource: 'TYPESCRIPT_HYBRID_ENGINE' | 'ML_PIPELINE' | 'RULE_BASED'
  modelVersion: string
  modelSnapshotId: string
  trainedSamples: number
  isUncertain: boolean
  algorithm: string
  topFeatures: Array<{ feature: string; weight: number }>
  errorDetail?: string
}

/**
 * Executes classification using the TypeScript Hybrid Architecture as the primary path.
 * Returns truthful provenance, snapshot metadata, and confidence scores.
 */
export async function predictWithML(
  entry: EntryLike | string,
  uncertaintyThreshold: number = 0.35
): Promise<MLPredictionResult> {
  const snapshot = getLatestSnapshot()
  const models = getActiveModels()

  // Primary execution: TypeScript Hybrid Architecture
  const result = classifyEntry(entry, '', 'ALL', 'HYBRID_ENSEMBLE', models)
  const predictedGenre = result.genre.value
  const confidence = result.genre.confidence

  const probabilities: Record<string, number> = {}
  for (const s of result.genre.allScores) {
    probabilities[s.genre] = s.confidence
  }

  const topFeatures = (result.algorithmicBreakdown?.topFeatures && result.algorithmicBreakdown.topFeatures.length > 0)
    ? result.algorithmicBreakdown.topFeatures.map(f => ({ feature: f.term, weight: Math.round(f.tfidf * 1000) / 1000 }))
    : result.genre.rulesApplied.map(r => ({ feature: r, weight: 1.0 }))

  return {
    predictedGenre,
    confidence,
    probabilities,
    predictionSource: 'TYPESCRIPT_HYBRID_ENGINE',
    modelVersion: snapshot.id,
    modelSnapshotId: snapshot.id,
    trainedSamples: snapshot.trainedSamples,
    isUncertain: predictedGenre === 'UNCLASSIFIED' || confidence < uncertaintyThreshold,
    algorithm: 'ManoboLit Supervised Machine Learning Ensemble (Multinomial NB + TF-IDF VSM + Char N-Gram)',
    topFeatures,
  }
}
