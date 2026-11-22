// ML Service Client and TypeScript Hybrid Classification Bridge
// Documents truthful provenance:
// 1. Primary: the model trained in Google Colab (notebooks/ManoboLit_Genre_Classifier_Trainer.ipynb),
//    uploaded by an admin and stored in MLModelRegistry; inference runs in-process (trainedModel.ts).
// 2. Fallback (no model uploaded): the in-app learned ensemble (Multinomial NB + TF-IDF VSM + Char N-Gram + k-NN).
// Hand-written domain rules never decide the genre; they are an evaluation baseline only.

import { classifyEntry, EntryLike } from './engine'
import { getLatestSnapshot, ensureActiveModels } from './retrain'
import { getActiveTrainedModel, predictWithCompiled } from './trainedModel'

export interface MLPredictionResult {
  predictedGenre: string
  confidence: number
  probabilities: Record<string, number>
  predictionSource: 'COLAB_TRAINED_MODEL' | 'TYPESCRIPT_HYBRID_ENGINE' | 'ML_PIPELINE' | 'RULE_BASED'
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
  // Primary execution: the Colab-trained model uploaded by an admin
  const trainedModel = await getActiveTrainedModel()
  if (trainedModel) {
    const input = typeof entry === 'string'
      ? { transcription: entry, translation: '' }
      : { transcription: entry.transcription || '', translation: entry.translation || '' }
    const p = predictWithCompiled(trainedModel, input)
    const a = trainedModel.artifact
    const probabilities: Record<string, number> = {}
    for (const x of p.probabilities) probabilities[x.genre] = Math.round(x.probability * 1000) / 1000
    const topFeatures = p.isUnclassified ? [] : (a.topFeatures?.[p.genre] || []).slice(0, 10)
    return {
      predictedGenre: p.genre,
      confidence: p.confidence,
      probabilities,
      predictionSource: 'COLAB_TRAINED_MODEL',
      modelVersion: a.version,
      modelSnapshotId: a.version,
      trainedSamples: a.trainedSamples,
      isUncertain: p.isUnclassified || p.confidence < uncertaintyThreshold,
      algorithm: `${a.algorithm} (trained in Google Colab)`,
      topFeatures,
    }
  }

  const models = await ensureActiveModels()
  const snapshot = getLatestSnapshot()

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
    predictionSource: 'TYPESCRIPT_HYBRID_ENGINE',
    modelVersion: snapshot.id,
    modelSnapshotId: snapshot.id,
    trainedSamples: snapshot.trainedSamples,
    isUncertain: predictedGenre === 'UNCLASSIFIED' || confidence < uncertaintyThreshold,
    algorithm: 'In-app learned ensemble (Multinomial NB + TF-IDF VSM + Char N-Gram + k-NN)',
    topFeatures,
  }
}
