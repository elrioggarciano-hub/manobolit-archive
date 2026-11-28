// Leave-One-Out Cross-Validation (LOOCV) Evaluation Module
// Enforces rigorous, honest, and defensible out-of-sample machine learning evaluation.
// Every fold retrains all models without the held-out entry or any overlapping training documents.

import { TRAINING_CORPUS, TrainingDocument, deriveActiveGenres } from './trainingCorpus'
import { trainNaiveBayes } from './naiveBayes'
import { trainTfidf } from './tfidf'
import { trainCharNgram } from './charNgram'
import { trainKnn } from './knn'
import { classifyHybrid } from './hybrid'
import { cleanClassificationText, stripGenreDescriptors, stripRiddleAnswer } from './textCleaning'
import { tokenizeUnigrams } from './tokenizer'
import { ScorableEntry } from './metrics'
import type { RuleSet } from './rules'

export type TextAblationConfig = 'both' | 'transcription_only' | 'translation_only' | 'with_title'

export interface LOOCVOptions {
  textConfig?: TextAblationConfig
  stripAnswer?: boolean
  /** Base training corpus (defaults to the bundled fallback corpus). */
  baseCorpus?: TrainingDocument[]
  /** Rule base (defaults to the bundled fallback rules); pass the database rule set for live evaluation. */
  rules?: RuleSet
}

export interface PerClassMetrics {
  genre: string
  tp: number
  fp: number
  fn: number
  precision: number
  recall: number
  f1: number
  support: number
}

export interface PredictionDetail {
  entryId: string
  title: string
  actual: string
  predicted: string
  confidence: number
  isCorrect: boolean
}

export interface ModeEvaluationResult {
  modeKey: string
  modeName: string
  flaggedInSample: boolean
  accuracy: number
  macroPrecision: number
  macroRecall: number
  macroF1: number
  coverage: number
  coveredAccuracy: number
  sampleSize: number
  perClass: PerClassMetrics[]
  confusionMatrix: Record<string, Record<string, number>>
  predictions: PredictionDetail[]
}

export interface MajorityBaseline {
  genre: string
  count: number
  proportion: number
}

export interface LOOCVReport {
  sampleSize: number
  textConfig: TextAblationConfig
  stripAnswer: boolean
  majorityBaseline: MajorityBaseline
  modes: {
    ruleBasedStrict: ModeEvaluationResult
    ruleBasedFramework: ModeEvaluationResult
    ruleBasedFull: ModeEvaluationResult
    naiveBayes: ModeEvaluationResult
    tfidfVsm: ModeEvaluationResult
    charNgram: ModeEvaluationResult
    knnMemory: ModeEvaluationResult
    hybridEnsemble: ModeEvaluationResult
  }
  winner: string
  academicDefenseSummary: string
}

// Docs in the training corpus that directly correspond to archive field collections
// (flagged with overlapsArchive in the corpus data).
export function overlappingDocIds(corpus: TrainingDocument[]): Set<string> {
  return new Set(corpus.filter(d => d.overlapsArchive).map(d => d.id))
}
export const ARCHIVE_OVERLAPPING_DOC_IDS = overlappingDocIds(TRAINING_CORPUS)

/**
 * Dynamically computes cosine token overlap between an entry and all training corpus docs
 * to prevent any latent data leakage across folds.
 */
export function findOverlappingDocIds(
  entryText: string,
  threshold: number = 0.35,
  corpus: TrainingDocument[] = TRAINING_CORPUS
): Set<string> {
  const tokensA = tokenizeUnigrams(entryText, true)
  const freqA = new Map<string, number>()
  for (const t of tokensA) freqA.set(t, (freqA.get(t) || 0) + 1)
  let sqA = 0
  for (const [_, c] of freqA) sqA += c * c

  const overlapping = new Set<string>()
  for (const doc of corpus) {
    const tokensB = tokenizeUnigrams(doc.text, true)
    const freqB = new Map<string, number>()
    for (const t of tokensB) freqB.set(t, (freqB.get(t) || 0) + 1)
    let sqB = 0
    let dot = 0
    for (const [t, c] of freqB) {
      sqB += c * c
      if (freqA.has(t)) dot += c * freqA.get(t)!
    }
    const cos = sqA > 0 && sqB > 0 ? dot / (Math.sqrt(sqA) * Math.sqrt(sqB)) : 0
    if (cos > threshold) {
      overlapping.add(doc.id)
    }
  }
  return overlapping
}

/**
 * Extracts and cleans entry text according to the specified evaluation text configuration.
 */
export function extractEntryText(
  entry: ScorableEntry,
  config: TextAblationConfig = 'both',
  stripAnswer: boolean = true
): string {
  let parts: (string | null | undefined)[] = []
  if (config === 'with_title') {
    parts = [entry.title, entry.transcription, entry.translation]
  } else if (config === 'transcription_only') {
    parts = [entry.transcription]
  } else if (config === 'translation_only') {
    parts = [entry.translation]
  } else {
    // Default 'both': transcription + translation ONLY
    parts = [entry.transcription, entry.translation]
  }

  let text = parts.filter(Boolean).join(' ')
  if (stripAnswer) {
    text = stripRiddleAnswer(text)
  }
  return stripGenreDescriptors(text)
}

/**
 * Calculates classification evaluation metrics including Macro P/R/F1, per-class stats,
 * and a confusion matrix over active genres and UNCLASSIFIED.
 */
export function evaluatePredictions(
  actuals: string[],
  predictions: string[],
  confidences: number[],
  entries: ScorableEntry[],
  modeKey: string,
  modeName: string,
  flaggedInSample: boolean = false,
  genres: readonly string[] = deriveActiveGenres(actuals, 1)
): ModeEvaluationResult {
  const sampleSize = actuals.length
  let correct = 0
  let covered = 0

  const allPossibleColumns = [...genres, 'UNCLASSIFIED']

  // Initialize confusion matrix
  const confusionMatrix: Record<string, Record<string, number>> = {}
  for (const act of genres) {
    confusionMatrix[act] = {}
    for (const pred of allPossibleColumns) {
      confusionMatrix[act][pred] = 0
    }
  }

  const predictionDetails: PredictionDetail[] = []

  for (let i = 0; i < sampleSize; i++) {
    const act = actuals[i]
    const pred = predictions[i]
    const conf = confidences[i]
    const isCorrect = pred === act

    if (isCorrect) correct++
    if (pred !== 'UNCLASSIFIED') covered++

    if (confusionMatrix[act]) {
      if (confusionMatrix[act][pred] !== undefined) {
        confusionMatrix[act][pred]++
      } else {
        confusionMatrix[act]['UNCLASSIFIED']++
      }
    }

    predictionDetails.push({
      entryId: (entries[i] as any).id || `entry-${i + 1}`,
      title: entries[i].title || `Entry #${i + 1}`,
      actual: act,
      predicted: pred,
      confidence: conf,
      isCorrect,
    })
  }

  const accuracy = sampleSize > 0 ? Math.round((correct / sampleSize) * 1000) / 1000 : 0
  const coverage = sampleSize > 0 ? Math.round((covered / sampleSize) * 1000) / 1000 : 0
  const coveredAccuracy = covered > 0 ? Math.round((correct / covered) * 1000) / 1000 : 0

  // Per-class metrics
  const perClass: PerClassMetrics[] = genres.map(genre => {
    let tp = 0
    let fp = 0
    let fn = 0
    let support = 0

    for (let i = 0; i < sampleSize; i++) {
      const act = actuals[i]
      const pred = predictions[i]

      if (act === genre) support++
      if (act === genre && pred === genre) tp++
      if (act !== genre && pred === genre) fp++
      if (act === genre && pred !== genre) fn++
    }

    const precision = tp + fp > 0 ? Math.round((tp / (tp + fp)) * 1000) / 1000 : 0
    const recall = tp + fn > 0 ? Math.round((tp / (tp + fn)) * 1000) / 1000 : 0
    const f1 = precision + recall > 0 ? Math.round(((2 * precision * recall) / (precision + recall)) * 1000) / 1000 : 0

    return { genre, tp, fp, fn, precision, recall, f1, support }
  })

  const activeWithSupport = perClass.filter(p => p.support > 0)
  const avg = (nums: number[]) => (nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0)

  const macroPrecision = Math.round(avg(activeWithSupport.map(p => p.precision)) * 1000) / 1000
  const macroRecall = Math.round(avg(activeWithSupport.map(p => p.recall)) * 1000) / 1000
  const macroF1 = Math.round(avg(activeWithSupport.map(p => p.f1)) * 1000) / 1000

  return {
    modeKey,
    modeName,
    flaggedInSample,
    accuracy,
    macroPrecision,
    macroRecall,
    macroF1,
    coverage,
    coveredAccuracy,
    sampleSize,
    perClass,
    confusionMatrix,
    predictions: predictionDetails,
  }
}

/**
 * Runs true Leave-One-Out Cross-Validation (LOOCV) over the provided archive entries.
 * Per fold:
 * 1. Held-out entry i is removed.
 * 2. Overlapping docs from TRAINING_CORPUS are excluded.
 * 3. Models (Naive Bayes, TF-IDF, Character N-gram) are retrained on (clean TRAINING_CORPUS + other 21 archive entries).
 * 4. Held-out entry i is scored across all 6 classification modes.
 */
export function runLOOCV(
  allEntries: ScorableEntry[],
  options: LOOCVOptions = {}
): LOOCVReport {
  const textConfig = options.textConfig || 'both'
  const stripAnswer = options.stripAnswer !== undefined ? options.stripAnswer : true
  // Genres with enough examples are evaluated (same rule as the notebook); others cannot be learned yet
  const genres = deriveActiveGenres(allEntries.map(e => e.genre))
  const entries = allEntries.filter(e => genres.includes(e.genre))
  const sampleSize = entries.length
  const corpus = options.baseCorpus || TRAINING_CORPUS
  const corpusOverlaps = overlappingDocIds(corpus)

  const actuals = entries.map(e => e.genre)

  // Compute Majority-Class Baseline
  const genreCounts: Record<string, number> = {}
  for (const g of actuals) genreCounts[g] = (genreCounts[g] || 0) + 1

  let maxGenre = genres[0]
  let maxCount = 0
  for (const [g, count] of Object.entries(genreCounts)) {
    if (count > maxCount) {
      maxCount = count
      maxGenre = g
    }
  }
  const majorityBaseline: MajorityBaseline = {
    genre: maxGenre,
    count: maxCount,
    proportion: sampleSize > 0 ? Math.round((maxCount / sampleSize) * 1000) / 1000 : 0,
  }

  const modeDefinitions = [
    { key: 'ruleBasedStrict', name: 'RULES (framework-strict, lower bound)', algo: 'RULE_BASED' as const, profile: 'framework-strict' as const, inSample: false },
    { key: 'ruleBasedFramework', name: 'RULES (framework-only)', algo: 'RULE_BASED' as const, profile: 'framework-only' as const, inSample: false },
    { key: 'ruleBasedFull', name: 'RULES (full, flagged in-sample)', algo: 'RULE_BASED' as const, profile: 'full' as const, inSample: true },
    { key: 'naiveBayes', name: 'NAIVE_BAYES_ML', algo: 'NAIVE_BAYES_ML' as const, profile: 'framework-only' as const, inSample: false },
    { key: 'tfidfVsm', name: 'TF_IDF_VSM', algo: 'TF_IDF_VSM' as const, profile: 'framework-only' as const, inSample: false },
    { key: 'charNgram', name: 'CHAR_NGRAM', algo: 'CHAR_NGRAM' as const, profile: 'framework-only' as const, inSample: false },
    { key: 'knnMemory', name: 'KNN_MEMORY', algo: 'KNN_MEMORY' as const, profile: 'framework-only' as const, inSample: false },
    { key: 'hybridEnsemble', name: 'HYBRID_ENSEMBLE', algo: 'HYBRID_ENSEMBLE' as const, profile: 'framework-only' as const, inSample: false },
  ]

  const predsByMode: Record<string, string[]> = {}
  const confsByMode: Record<string, number[]> = {}
  for (const m of modeDefinitions) {
    predsByMode[m.key] = []
    confsByMode[m.key] = []
  }

  // Execute N folds
  for (let i = 0; i < sampleSize; i++) {
    const heldOut = entries[i]
    const testText = extractEntryText(heldOut, textConfig, stripAnswer)

    // Dynamic + explicit map-based overlapping docs exclusion
    const excludedDocs = new Set<string>([...corpusOverlaps])
    for (const doc of corpus) {
      if (doc.archiveEntryId && (heldOut as any).id && doc.archiveEntryId === (heldOut as any).id) {
        excludedDocs.add(doc.id)
      }
    }
    const dynamicOverlaps = findOverlappingDocIds(testText, 0.35, corpus)
    for (const id of dynamicOverlaps) excludedDocs.add(id)

    // Clean base training corpus
    const baseCorpus = corpus.filter(d => !excludedDocs.has(d.id))

    // Convert remaining N-1 entries into TrainingDocuments
    const otherArchiveDocs: TrainingDocument[] = entries
      .filter((_, idx) => idx !== i)
      .map((e, idx) => ({
        id: (e as any).id || `archive-fold-${i}-${idx}`,
        text: extractEntryText(e, textConfig, stripAnswer),
        genre: e.genre as any,
        themes: (e as any).themes || [],
        provenance: (e as any).communityLocation || 'Agusan Manobo Archive',
        source: 'archive-verbatim' as const,
        citation: 'Field Collection',
      }))

    const foldDocs = [...baseCorpus, ...otherArchiveDocs]

    // Retrain fold models
    const foldNbModel = trainNaiveBayes(foldDocs, 1.0, genres)
    const foldTfidfModel = trainTfidf(foldDocs, genres)
    const foldCharModel = trainCharNgram(foldDocs, genres)
    const foldKnnModel = trainKnn(foldDocs, undefined, genres)

    // Provenance location metadata
    const locParts = [
      (heldOut as any).communityLocation,
      (heldOut as any).barangay,
      (heldOut as any).municipality,
      (heldOut as any).province,
    ].filter(Boolean)
    const locInput = locParts.length > 0 ? locParts.join(', ') : undefined

    // Classify held-out entry across all modes
    for (const m of modeDefinitions) {
      const models = {
        nb: foldNbModel,
        tfidf: foldTfidfModel,
        charNgram: foldCharModel,
        knn: foldKnnModel,
        genres,
        rules: options.rules,
        rulesProfile: m.profile,
      }
      const res = classifyHybrid(testText, 'ALL', m.algo, models, locInput)
      predsByMode[m.key].push(res.genre.value)
      confsByMode[m.key].push(res.genre.confidence)
    }
  }

  // Build evaluated results per mode
  const modeResults: Record<string, ModeEvaluationResult> = {}
  for (const m of modeDefinitions) {
    modeResults[m.key] = evaluatePredictions(
      actuals,
      predsByMode[m.key],
      confsByMode[m.key],
      entries,
      m.key,
      m.name,
      m.inSample,
      genres
    )
  }

  // Determine winner across all honest out-of-sample modes by Macro-F1
  // (RULES full is excluded from winner selection because it is flagged in-sample)
  const candidateModes = [
    modeResults.hybridEnsemble,
    modeResults.ruleBasedFramework,
    modeResults.charNgram,
    modeResults.knnMemory,
    modeResults.tfidfVsm,
    modeResults.naiveBayes,
  ]

  let maxF1 = -1
  for (const cand of candidateModes) {
    if (cand.macroF1 > maxF1) {
      maxF1 = cand.macroF1
    }
  }

  const tiedWinners = candidateModes.filter(c => Math.abs(c.macroF1 - maxF1) < 0.0001)
  let winnerString = ''
  if (tiedWinners.length > 1) {
    winnerString = `TIE: ${tiedWinners.map(t => t.modeName).join(', ')} (Macro-F1=${maxF1.toFixed(3)})`
  } else if (tiedWinners.length === 1) {
    winnerString = `${tiedWinners[0].modeName} (Macro-F1=${maxF1.toFixed(3)})`
  } else {
    winnerString = 'NONE'
  }

  // Ranked out-of-sample modes
  const ranked = [...candidateModes].sort((a, b) => b.macroF1 - a.macroF1)
  const rankingSummary = ranked
    .map((r, i) => `${i + 1}. ${r.modeName} (F1=${r.macroF1.toFixed(3)}, Acc=${(r.accuracy * 100).toFixed(1)}%, Cov=${(r.coverage * 100).toFixed(1)}%)`)
    .join('; ')

  const academicDefenseSummary =
    `LOOCV on N=${sampleSize} archive entries across 4 active genres (Majority baseline: ${majorityBaseline.genre} = ${(majorityBaseline.proportion * 100).toFixed(1)}%). ` +
    `Ranked by Macro-F1: ${rankingSummary}. ` +
    `In-sample reference: ${modeResults.ruleBasedFull.modeName} (F1=${modeResults.ruleBasedFull.macroF1.toFixed(3)}, Acc=${(modeResults.ruleBasedFull.accuracy * 100).toFixed(1)}%). ` +
    `Winner: ${winnerString}.`

  return {
    sampleSize,
    textConfig,
    stripAnswer,
    majorityBaseline,
    modes: {
      ruleBasedStrict: modeResults.ruleBasedStrict,
      ruleBasedFramework: modeResults.ruleBasedFramework,
      ruleBasedFull: modeResults.ruleBasedFull,
      naiveBayes: modeResults.naiveBayes,
      tfidfVsm: modeResults.tfidfVsm,
      charNgram: modeResults.charNgram,
      knnMemory: modeResults.knnMemory,
      hybridEnsemble: modeResults.hybridEnsemble,
    },
    winner: winnerString,
    academicDefenseSummary,
  }
}

/**
 * Runs the complete suite of ablation studies in LOOCV across text input channels and editorial features:
 * (a) Manobo text only ('transcription_only')
 * (b) English translation only ('translation_only')
 * (c) Both ('both', default honest pipeline)
 * (d) With title ('with_title')
 * (e) Without answer stripping (editorial format leakage ablation)
 */
export function runAllAblations(entries: ScorableEntry[]): Record<string, LOOCVReport> {
  return {
    both_honest: runLOOCV(entries, { textConfig: 'both', stripAnswer: true }),
    manobo_only: runLOOCV(entries, { textConfig: 'transcription_only', stripAnswer: true }),
    english_only: runLOOCV(entries, { textConfig: 'translation_only', stripAnswer: true }),
    with_title: runLOOCV(entries, { textConfig: 'with_title', stripAnswer: true }),
    unstripped_answer: runLOOCV(entries, { textConfig: 'both', stripAnswer: false }),
  }
}


export interface ThemeEvaluation {
  sampleSize: number
  learnedKnn: { precision: number; recall: number; f1: number }
  keywordRulesBaseline: { precision: number; recall: number; f1: number }
  rulesPlusKnn: { precision: number; recall: number; f1: number }
}

/**
 * Leave-one-out evaluation of multi-label THEME prediction (micro-averaged P/R/F1):
 * learned k-NN themes (exemplars exclude the held-out entry) vs. the keyword-rule baseline.
 */
export function runThemeLOOCV(entries: ScorableEntry[], options: LOOCVOptions = {}): ThemeEvaluation {
  const textConfig = options.textConfig || 'both'
  const stripAnswer = options.stripAnswer !== undefined ? options.stripAnswer : true
  const corpus = options.baseCorpus || TRAINING_CORPUS
  const base = corpus.filter(d => !overlappingDocIds(corpus).has(d.id))
  const tally = { knn: { tp: 0, fp: 0, fn: 0 }, rules: { tp: 0, fp: 0, fn: 0 }, combined: { tp: 0, fp: 0, fn: 0 } }

  entries.forEach((heldOut, i) => {
    const gold = new Set<string>(((heldOut as any).themes as string[]) || [])
    const others: TrainingDocument[] = entries
      .filter((_, idx) => idx !== i)
      .map((e, idx) => ({
        id: (e as any).id || `theme-fold-${i}-${idx}`,
        text: extractEntryText(e, textConfig, stripAnswer),
        genre: e.genre as any,
        themes: (e as any).themes || [],
        provenance: 'Agusan Manobo Archive',
        source: 'archive-verbatim' as const,
      }))
    const text = extractEntryText(heldOut, textConfig, stripAnswer)
    const genres = deriveActiveGenres(entries.map(e => e.genre))
    const knn = trainKnn([...base, ...others], undefined, genres)
    const predicted = {
      knn: new Set(classifyHybrid(text, 'ALL', 'KNN_MEMORY', { knn, genres }).themes.map(t => t.value)),
      rules: new Set(classifyHybrid(text, 'ALL', 'RULE_BASED', { rulesProfile: 'framework-only' }).themes.map(t => t.value)),
      combined: new Set(classifyHybrid(text, 'ALL', 'HYBRID_ENSEMBLE', { knn, genres, rulesProfile: 'framework-only' }).themes.map(t => t.value)),
    }
    for (const key of ['knn', 'rules', 'combined'] as const) {
      for (const p of predicted[key]) gold.has(p) ? tally[key].tp++ : tally[key].fp++
      for (const g of gold) if (!predicted[key].has(g)) tally[key].fn++
    }
  })

  const score = ({ tp, fp, fn }: { tp: number; fp: number; fn: number }) => {
    const precision = tp + fp ? tp / (tp + fp) : 0
    const recall = tp + fn ? tp / (tp + fn) : 0
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
    const r = (x: number) => Math.round(x * 1000) / 1000
    return { precision: r(precision), recall: r(recall), f1: r(f1) }
  }
  return { sampleSize: entries.length, learnedKnn: score(tally.knn), keywordRulesBaseline: score(tally.rules), rulesPlusKnn: score(tally.combined) }
}
