// ML Service Client and TypeScript Hybrid Classification Bridge
// Documents truthful provenance:
// Rule-based classification (Eugenio 1993 / Andress 1985 rule base in the database) combined with ML:
// 1. Primary: rule scores blended with the model trained in Google Colab (MLModelRegistry artifact).
// 2. Fallback (no model uploaded): rules blended with the in-app learned models (NB + TF-IDF + Char N-Gram + k-NN).

import { classifyEntry, EntryLike } from './engine'
import { getLatestSnapshot, ensureActiveModels } from './retrain'
import { getActiveTrainedModel, predictWithCompiled } from './trainedModel'
import { blendRulesWithModel } from './ruleMlBlend'

export interface MLPredictionResult {
  predictedGenre: string
  confidence: number
  probabilities: Record<string, number>
  predictionSource: 'RULES_PLUS_COLAB_MODEL' | 'RULES_PLUS_LEARNED_ENSEMBLE' | 'ML_PIPELINE' | 'RULE_BASED'
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
  const models = await ensureActiveModels()
  const snapshot = getLatestSnapshot()

  // Primary execution: rule-based scores (database rule base) combined with the Colab-trained model
  const trainedModel = await getActiveTrainedModel()
  if (trainedModel) {
    const input = typeof entry === 'string'
      ? { transcription: entry, translation: '' }
      : { transcription: entry.transcription || '', translation: entry.translation || '' }
    const p = predictWithCompiled(trainedModel, input)
    const rules = classifyEntry(entry, '', 'ALL', 'RULE_BASED', models)
    const a = trainedModel.artifact
    const b = blendRulesWithModel(rules.genre.allScores, p.probabilities, a.unclassifiedThreshold)
    const probabilities: Record<string, number> = {}
    for (const x of b.distribution) probabilities[x.genre] = x.confidence
    const topFeatures = b.isUnclassified ? [] : (a.topFeatures?.[b.genre] || []).slice(0, 10)
    return {
      predictedGenre: b.genre,
      confidence: b.confidence,
      probabilities,
      predictionSource: 'RULES_PLUS_COLAB_MODEL',
      modelVersion: a.version,
      modelSnapshotId: a.version,
      trainedSamples: a.trainedSamples,
      isUncertain: b.isUnclassified || b.confidence < uncertaintyThreshold,
      algorithm: `Rule-based (Eugenio/Andress) + ${a.algorithm} trained in Google Colab`,
      topFeatures,
    }
  }

  // Fallback: in-app learned ensemble (NB + TF-IDF + Char N-gram + k-NN)
  const result = classifyEntry(entry, '', 'ALL', 'HYBRID_ENSEMBLE', models)
  const predictedGenre = result.genre.value
  const confidence = result.genre.confidence

  const probabilities: Record<string, number> = {}
  for (const s of result.genre.allScores) {
    probabilities[s.genre] = s.confidence
  }

  const topFeatures = (result.algorithmicBreakdown?.topFeatures && result.algorithmicBreakdown.topFeatures.length > 0)
    ? result.algorithmicBreakdown.topFeatures.map(f => ({ feature: f.term, weight: Math.round(f.tfidf * 1000) / 1000 }))
    : []

  return {
    predictedGenre,
    confidence,
    probabilities,
    predictionSource: 'RULES_PLUS_LEARNED_ENSEMBLE',
    modelVersion: snapshot.id,
    modelSnapshotId: snapshot.id,
    trainedSamples: snapshot.trainedSamples,
    isUncertain: predictedGenre === 'UNCLASSIFIED' || confidence < uncertaintyThreshold,
    algorithm: 'Rule-based (Eugenio/Andress) + in-app learned models (Multinomial NB + TF-IDF VSM + Char N-Gram + k-NN)',
    topFeatures,
  }
}
