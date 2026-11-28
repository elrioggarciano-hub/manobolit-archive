import { classifyEntry } from './engine'
import { AlgorithmMode, InjectableModels } from './hybrid'
import { runLOOCV, LOOCVReport, LOOCVOptions, MajorityBaseline } from './evaluation'

export interface AccuracyMetrics {
  accuracy: number
  precision: number
  recall: number
  f1: number
  sampleSize: number
  coverage?: number
  coveredAccuracy?: number
  flaggedInSample?: boolean
}

export interface ModelComparisonReport {
  ruleBased: AccuracyMetrics
  ruleBasedFull?: AccuracyMetrics
  tfidfVsm: AccuracyMetrics
  naiveBayes: AccuracyMetrics
  charNgram: AccuracyMetrics
  hybridEnsemble: AccuracyMetrics
  winner: string
  academicDefenseSummary: string
  majorityClassBaseline?: MajorityBaseline
}

export interface ScorableEntry {
  id?: string
  title?: string
  content?: string
  transcription?: string | null
  translation?: string | null
  bisayaTranslation?: string | null
  genre: string
  themes?: string[]
  communityLocation?: string | null
  barangay?: string | null
  municipality?: string | null
  province?: string | null
}

/**
 * Evaluates a single classifier algorithm against curated ground truth genre labels.
 * Evaluates primary oral text (transcription + translation ONLY).
 */
export function computeAccuracyMetrics(
  entries: ScorableEntry[],
  algorithmMode: AlgorithmMode = 'HYBRID_ENSEMBLE',
  models?: InjectableModels
): AccuracyMetrics {
  if (entries.length === 0) {
    return { accuracy: 0, precision: 0, recall: 0, f1: 0, sampleSize: 0, coverage: 0, coveredAccuracy: 0 }
  }

  const classes = Array.from(new Set(entries.map(e => e.genre)))
  const stats: Record<string, { tp: number; fp: number; fn: number }> = {}
  for (const c of classes) stats[c] = { tp: 0, fp: 0, fn: 0 }

  let correct = 0
  let covered = 0

  for (const entry of entries) {
    const textToClassify = [entry.transcription, entry.translation].filter(Boolean).join(' ')
    const result = classifyEntry(textToClassify, '', 'ALL', algorithmMode, models)
    const predicted = result.genre.value
    const actual = entry.genre

    if (predicted !== 'UNCLASSIFIED') {
      covered++
    }

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

  const avg = (nums: number[]) => (nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0)

  return {
    accuracy: Math.round((correct / entries.length) * 1000) / 1000,
    precision: Math.round(avg(perClass.map(p => p.precision)) * 1000) / 1000,
    recall: Math.round(avg(perClass.map(p => p.recall)) * 1000) / 1000,
    f1: Math.round(avg(perClass.map(p => p.f1)) * 1000) / 1000,
    sampleSize: entries.length,
    coverage: Math.round((covered / entries.length) * 1000) / 1000,
    coveredAccuracy: covered > 0 ? Math.round((correct / covered) * 1000) / 1000 : 0,
  }
}

/**
 * Runs true Leave-One-Out Cross-Validation (LOOCV) comparative benchmark across all classification modes:
 * Rule-Based (framework-only) vs Rule-Based (full in-sample) vs TF-IDF VSM vs Naive Bayes ML vs Character N-Gram VSM vs Hybrid Ensemble.
 *
 * Winner is selected strictly by argmax over out-of-sample Macro-F1 (ties reported honestly).
 * Summary string is dynamically generated strictly from computed metrics without hardcoded or causal claims.
 */
export function computeComparativeMetrics(
  entries: ScorableEntry[],
  /** Pass the database corpus (baseCorpus) and rule base (rules) so the benchmark reflects the live data. */
  options: Pick<LOOCVOptions, 'baseCorpus' | 'rules'> = {}
): ModelComparisonReport {
  if (entries.length === 0) {
    const emptyMetrics: AccuracyMetrics = { accuracy: 0, precision: 0, recall: 0, f1: 0, sampleSize: 0, coverage: 0 }
    return {
      ruleBased: emptyMetrics,
      ruleBasedFull: emptyMetrics,
      tfidfVsm: emptyMetrics,
      naiveBayes: emptyMetrics,
      charNgram: emptyMetrics,
      hybridEnsemble: emptyMetrics,
      winner: 'NONE',
      academicDefenseSummary: 'No entries provided for evaluation.',
    }
  }

  // Run LOOCV across all folds with fold-retrained models
  const loocv: LOOCVReport = runLOOCV(entries, { textConfig: 'both', stripAnswer: true, ...options })

  const ruleBased: AccuracyMetrics = {
    accuracy: loocv.modes.ruleBasedFramework.accuracy,
    precision: loocv.modes.ruleBasedFramework.macroPrecision,
    recall: loocv.modes.ruleBasedFramework.macroRecall,
    f1: loocv.modes.ruleBasedFramework.macroF1,
    sampleSize: loocv.sampleSize,
    coverage: loocv.modes.ruleBasedFramework.coverage,
    coveredAccuracy: loocv.modes.ruleBasedFramework.coveredAccuracy,
    flaggedInSample: false,
  }

  const ruleBasedFull: AccuracyMetrics = {
    accuracy: loocv.modes.ruleBasedFull.accuracy,
    precision: loocv.modes.ruleBasedFull.macroPrecision,
    recall: loocv.modes.ruleBasedFull.macroRecall,
    f1: loocv.modes.ruleBasedFull.macroF1,
    sampleSize: loocv.sampleSize,
    coverage: loocv.modes.ruleBasedFull.coverage,
    coveredAccuracy: loocv.modes.ruleBasedFull.coveredAccuracy,
    flaggedInSample: true,
  }

  const tfidfVsm: AccuracyMetrics = {
    accuracy: loocv.modes.tfidfVsm.accuracy,
    precision: loocv.modes.tfidfVsm.macroPrecision,
    recall: loocv.modes.tfidfVsm.macroRecall,
    f1: loocv.modes.tfidfVsm.macroF1,
    sampleSize: loocv.sampleSize,
    coverage: loocv.modes.tfidfVsm.coverage,
    coveredAccuracy: loocv.modes.tfidfVsm.coveredAccuracy,
    flaggedInSample: false,
  }

  const naiveBayes: AccuracyMetrics = {
    accuracy: loocv.modes.naiveBayes.accuracy,
    precision: loocv.modes.naiveBayes.macroPrecision,
    recall: loocv.modes.naiveBayes.macroRecall,
    f1: loocv.modes.naiveBayes.macroF1,
    sampleSize: loocv.sampleSize,
    coverage: loocv.modes.naiveBayes.coverage,
    coveredAccuracy: loocv.modes.naiveBayes.coveredAccuracy,
    flaggedInSample: false,
  }

  const charNgram: AccuracyMetrics = {
    accuracy: loocv.modes.charNgram.accuracy,
    precision: loocv.modes.charNgram.macroPrecision,
    recall: loocv.modes.charNgram.macroRecall,
    f1: loocv.modes.charNgram.macroF1,
    sampleSize: loocv.sampleSize,
    coverage: loocv.modes.charNgram.coverage,
    coveredAccuracy: loocv.modes.charNgram.coveredAccuracy,
    flaggedInSample: false,
  }

  const hybridEnsemble: AccuracyMetrics = {
    accuracy: loocv.modes.hybridEnsemble.accuracy,
    precision: loocv.modes.hybridEnsemble.macroPrecision,
    recall: loocv.modes.hybridEnsemble.macroRecall,
    f1: loocv.modes.hybridEnsemble.macroF1,
    sampleSize: loocv.sampleSize,
    coverage: loocv.modes.hybridEnsemble.coverage,
    coveredAccuracy: loocv.modes.hybridEnsemble.coveredAccuracy,
    flaggedInSample: false,
  }

  return {
    ruleBased,
    ruleBasedFull,
    tfidfVsm,
    naiveBayes,
    charNgram,
    hybridEnsemble,
    winner: loocv.winner,
    academicDefenseSummary: loocv.academicDefenseSummary,
    majorityClassBaseline: loocv.majorityBaseline,
  }
}
