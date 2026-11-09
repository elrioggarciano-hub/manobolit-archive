import { classifyEntry, EntryLike } from './engine'

export interface MLPredictionResult {
  predictedGenre: string
  confidence: number
  probabilities: Record<string, number>
  predictionSource: 'ML_PIPELINE' | 'RULE_BASED' | 'RULE_BASED_FALLBACK'
  modelVersion: string
  isUncertain: boolean
  algorithm: string
  topFeatures: Array<{ feature: string; weight: number }>
  errorDetail?: string
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000'
const ML_TIMEOUT_MS = 2500

/**
 * Predicts the category of an archive entry using the Python scikit-learn ML service.
 * If the ML service is unavailable, offline, or returns an error, gracefully falls back
 * to the domain expert rule classifier without interrupting workflows.
 */
export async function predictWithML(
  entry: EntryLike | string,
  uncertaintyThreshold: number = 0.45
): Promise<MLPredictionResult> {
  const payload: Record<string, any> = { uncertaintyThreshold }

  if (typeof entry === 'object' && entry !== null) {
    payload.title = entry.title || ''
    payload.manoboTitle = entry.manoboTitle || ''
    payload.englishTitle = entry.englishTitle || ''
    payload.transcription = entry.transcription || ''
    payload.translation = entry.translation || ''
    payload.content = entry.content || ''
  } else {
    payload.text = String(entry)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ML_TIMEOUT_MS)

    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (res.ok) {
      const data = (await res.json()) as any
      return {
        predictedGenre: data.predicted_genre,
        confidence: data.confidence,
        probabilities: data.probabilities || {},
        predictionSource: data.prediction_source === 'ML_PIPELINE' ? 'ML_PIPELINE' : 'RULE_BASED',
        modelVersion: data.model_version || 'rules-baseline',
        isUncertain: Boolean(data.is_uncertain),
        algorithm: data.algorithm || 'Scikit-learn Pipeline',
        topFeatures: data.top_features || [],
      }
    }
  } catch (err: any) {
    // Expected when FastAPI service is not started; rule fallback executes cleanly
    console.warn(`[ML Client] Note: ML service unreachable at ${ML_SERVICE_URL}. Executing domain rule fallback.`)
  }

  // Graceful rule-based fallback
  const fallback = classifyEntry(entry)
  return {
    predictedGenre: fallback.genre.value,
    confidence: fallback.genre.confidence,
    probabilities: Object.fromEntries(fallback.genre.allScores.map(s => [s.genre, s.confidence])),
    predictionSource: 'RULE_BASED_FALLBACK',
    modelVersion: 'rules-baseline',
    isUncertain: fallback.genre.confidence < uncertaintyThreshold,
    algorithm: 'Domain Expert System (Eugenio 1993)',
    topFeatures: fallback.genre.rulesApplied.map(r => ({ feature: r, weight: 1.0 })),
  }
}
