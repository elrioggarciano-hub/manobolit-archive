import { classifyEntry } from './engine'
import { AlgorithmMode, InjectableModels } from './hybrid'

export interface AccuracyMetrics {
  accuracy: number
  precision: number
  recall: number
  f1: number
  sampleSize: number
}

export interface ModelComparisonReport {
  ruleBased: AccuracyMetrics
  tfidfVsm: AccuracyMetrics
  naiveBayes: AccuracyMetrics
  charNgram: AccuracyMetrics
  hybridEnsemble: AccuracyMetrics
  winner: AlgorithmMode
  academicDefenseSummary: string
}

export interface ScorableEntry {
  title?: string
  content: string
  transcription?: string | null
  translation?: string | null
  genre: string
}

/**
 * Evaluates a specific classifier algorithm against curated ground truth genre labels.
 */
export function computeAccuracyMetrics(
  entries: ScorableEntry[],
  algorithmMode: AlgorithmMode = 'HYBRID_ENSEMBLE',
  models?: InjectableModels
): AccuracyMetrics {
  if (entries.length === 0) {
    return { accuracy: 0, precision: 0, recall: 0, f1: 0, sampleSize: 0 }
  }

  const classes = Array.from(new Set(entries.map(e => e.genre)))
  const stats: Record<string, { tp: number; fp: number; fn: number }> = {}
  for (const c of classes) stats[c] = { tp: 0, fp: 0, fn: 0 }

  let correct = 0

  for (const entry of entries) {
    const textToClassify = [entry.title, entry.content, entry.translation].filter(Boolean).join(' ')
    const result = classifyEntry(textToClassify, entry.transcription || '', 'ALL', algorithmMode, models)
    const predicted = result.genre.value
    const actual = entry.genre

    if (predicted === actual) {
      correct++
      if (stats[predicted]) stats[predicted].tp++
    } else {
      if (stats[predicted]) stats[predicted].fp++
      if (stats[actual]) stats[actual].fn++
    }
  }

  const perClass = classes.map(c => {
    const { tp, fp, fn } = stats[c]
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
    return { precision, recall, f1 }
  })

  const avg = (nums: number[]) => nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0

  return {
    accuracy: Math.round((correct / entries.length) * 1000) / 1000,
    precision: Math.round(avg(perClass.map(p => p.precision)) * 1000) / 1000,
    recall: Math.round(avg(perClass.map(p => p.recall)) * 1000) / 1000,
    f1: Math.round(avg(perClass.map(p => p.f1)) * 1000) / 1000,
    sampleSize: entries.length,
  }
}

/**
 * Runs a comparative benchmark across all 5 models:
 * Rule-Based vs TF-IDF VSM vs Naive Bayes ML vs Character N-Gram VSM vs Hybrid Ensemble.
 */
export function computeComparativeMetrics(
  entries: ScorableEntry[],
  models?: InjectableModels
): ModelComparisonReport {
  const ruleBased = computeAccuracyMetrics(entries, 'RULE_BASED', models)
  const tfidfVsm = computeAccuracyMetrics(entries, 'TF_IDF_VSM', models)
  const naiveBayes = computeAccuracyMetrics(entries, 'NAIVE_BAYES_ML', models)
  const charNgram = computeAccuracyMetrics(entries, 'CHAR_NGRAM', models)
  const hybridEnsemble = computeAccuracyMetrics(entries, 'HYBRID_ENSEMBLE', models)

  let winner: AlgorithmMode = 'HYBRID_ENSEMBLE'
  if (naiveBayes.f1 > hybridEnsemble.f1) {
    winner = 'NAIVE_BAYES_ML'
  }

  const summary = `Evaluation across N=${entries.length} oral literature records: Naive Bayes (F1=${naiveBayes.f1.toFixed(3)}), Word TF-IDF VSM (F1=${tfidfVsm.f1.toFixed(3)}), Character N-Gram VSM (F1=${charNgram.f1.toFixed(3)}), Rule-Based (F1=${ruleBased.f1.toFixed(3)}), and Hybrid Ensemble (F1=${hybridEnsemble.f1.toFixed(3)}, ${(hybridEnsemble.accuracy * 100).toFixed(1)}% accuracy).`

  return {
    ruleBased,
    tfidfVsm,
    naiveBayes,
    charNgram,
    hybridEnsemble,
    winner,
    academicDefenseSummary: summary,
  }
}
