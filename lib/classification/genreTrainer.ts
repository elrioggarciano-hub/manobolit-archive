// In-app genre trainer: a TypeScript re-implementation of the Colab notebook's training and evaluation
// (notebooks/ManoboLit_Genre_Classifier_Trainer.ipynb), so the model can retrain itself whenever the
// verified dataset changes instead of waiting for someone to run the notebook.
//
//   scikit-learn                                                   here
//   TfidfVectorizer(analyzer="char_wb", ngram_range=(3,5),         fitTfidf / transform
//                   sublinear_tf=True)  (smooth idf, l2 norm)
//   LogisticRegression(C=1.0, class_weight="balanced", lbfgs)      fitLogReg (L-BFGS, same objective)
//   cross_val_predict(LeaveOneOut)                                 runLoocv
//
// It produces the same 'manobolit-sklearn-linear-v1' artifact the notebook exports, so inference
// (trainedModel.ts) is unchanged. Pure functions only: no database access.

import {
  ARTIFACT_FORMAT,
  TrainedModelArtifact,
  buildPreprocessRegexes,
  preprocessText,
  charWbNgrams,
} from './trainedModel'

export interface TrainingRow {
  id?: string
  title?: string
  transcription: string | null
  translation: string | null
  genre: string
  ruleScores?: Record<string, number>
}

export interface TrainerConfig {
  preprocessing: TrainedModelArtifact['preprocessing']
  unclassifiedThreshold: number
  ruleWeight: number
  minExamplesPerGenre: number
  C: number
  ngramRange: [number, number]
  seed: number
  learningCurveRepeats: number
}

// Same values as the notebook's configuration cells
export const DEFAULT_TRAINER_CONFIG: TrainerConfig = {
  preprocessing: {
    fields: ['transcription', 'translation'],
    answerMarkers: ['answer', 'tubag'],
    stripTerms: [
      'riddle', 'riddles', 'tigmo', 'proverb', 'proverbs', 'panultihon', 'folk song', 'folk songs',
      'epic', 'epics', 'myth', 'myths', 'legend', 'legends', 'chant', 'chants',
      'maravilla', 'catipay', 'curato',
    ],
  },
  unclassifiedThreshold: 0.35,
  ruleWeight: 0.5,
  minExamplesPerGenre: 2,
  C: 1.0,
  ngramRange: [3, 5],
  seed: 42,
  learningCurveRepeats: 10,
}

// ── TF-IDF (char_wb) ─────────────────────────────────────────────────────────

interface Sparse {
  idx: Int32Array
  val: Float64Array
}

interface Tfidf {
  terms: string[]
  index: Map<string, number>
  idf: Float64Array
  range: [number, number]
}

/** Character n-gram counts of one document (computed once, reused by every cross-validation fold). */
type GramCounts = Map<string, number>

function countGrams(text: string, range: [number, number]): GramCounts {
  const counts: GramCounts = new Map()
  for (const g of charWbNgrams(text, range)) counts.set(g, (counts.get(g) || 0) + 1)
  return counts
}

function fitTfidf(docs: GramCounts[], range: [number, number]): Tfidf {
  const df = new Map<string, number>()
  for (const d of docs) {
    for (const g of d.keys()) df.set(g, (df.get(g) || 0) + 1)
  }
  const terms = Array.from(df.keys()).sort() // sklearn sorts the vocabulary
  const n = docs.length
  const idf = new Float64Array(terms.length)
  terms.forEach((t, i) => (idf[i] = Math.log((1 + n) / (1 + df.get(t)!)) + 1)) // smooth_idf=True
  return { terms, index: new Map(terms.map((t, i) => [t, i])), idf, range }
}

function transform(doc: GramCounts, v: Tfidf): Sparse {
  const pairs: [number, number][] = []
  for (const [g, c] of doc) {
    const i = v.index.get(g)
    if (i !== undefined) pairs.push([i, c])
  }
  pairs.sort((a, b) => a[0] - b[0])
  const idx = Int32Array.from(pairs, p => p[0])
  const val = new Float64Array(idx.length)
  let sumSq = 0
  pairs.forEach(([i, c], k) => {
    const w = (1 + Math.log(c)) * v.idf[i] // sublinear_tf=True
    val[k] = w
    sumSq += w * w
  })
  const norm = Math.sqrt(sumSq)
  if (norm > 0) for (let k = 0; k < val.length; k++) val[k] /= norm
  return { idx, val }
}

// ── Logistic regression (multinomial, or binomial for 2 classes) ─────────────

interface LinearModel {
  classes: string[]
  coef: Float64Array[] // rows: K for multinomial, 1 for binary
  intercept: Float64Array
}

/**
 * Minimises  Σ_i w_i · logloss_i  +  ||W||² / (2C)   (intercept not penalised),
 * scaled by 1/Σw like scikit-learn. w_i = n / (K · n_class) for class_weight="balanced".
 */
function fitLogReg(X: Sparse[], labels: string[], D: number, C: number): LinearModel {
  const classes = Array.from(new Set(labels)).sort()
  const K = classes.length
  const y = labels.map(l => classes.indexOf(l))
  const n = X.length
  const classCount = classes.map((_, c) => y.filter(v => v === c).length)
  const sw = y.map(c => n / (K * classCount[c]))
  const S = sw.reduce((a, b) => a + b, 0)
  const R = K === 2 ? 1 : K // parameter rows
  const P = R * D + R // weights then intercepts
  const l2 = 1 / (C * S)

  const objective = (theta: Float64Array, grad: Float64Array): number => {
    grad.fill(0)
    let f = 0
    const z = new Float64Array(R)
    for (let i = 0; i < n; i++) {
      const { idx, val } = X[i]
      for (let r = 0; r < R; r++) {
        let s = theta[R * D + r]
        const off = r * D
        for (let k = 0; k < idx.length; k++) s += theta[off + idx[k]] * val[k]
        z[r] = s
      }
      const wi = sw[i] / S
      if (R === 1) {
        const t = y[i] // 1 = classes[1]
        const zz = z[0]
        // log(1 + e^z) − t·z, computed stably
        f += wi * ((zz > 0 ? zz + Math.log1p(Math.exp(-zz)) : Math.log1p(Math.exp(zz))) - t * zz)
        const g = wi * (1 / (1 + Math.exp(-zz)) - t)
        for (let k = 0; k < idx.length; k++) grad[idx[k]] += g * val[k]
        grad[D] += g
      } else {
        let max = -Infinity
        for (let r = 0; r < R; r++) if (z[r] > max) max = z[r]
        let sum = 0
        for (let r = 0; r < R; r++) sum += Math.exp(z[r] - max)
        const lse = max + Math.log(sum)
        f += wi * (lse - z[y[i]])
        for (let r = 0; r < R; r++) {
          const g = wi * (Math.exp(z[r] - lse) - (r === y[i] ? 1 : 0))
          const off = r * D
          for (let k = 0; k < idx.length; k++) grad[off + idx[k]] += g * val[k]
          grad[R * D + r] += g
        }
      }
    }
    for (let j = 0; j < R * D; j++) {
      f += 0.5 * l2 * theta[j] * theta[j]
      grad[j] += l2 * theta[j]
    }
    return f
  }

  const theta = lbfgs(objective, new Float64Array(P))
  const coef = Array.from({ length: R }, (_, r) => theta.slice(r * D, (r + 1) * D))
  return { classes, coef, intercept: theta.slice(R * D) }
}

/** Limited-memory BFGS with backtracking (Armijo) line search; the objective is smooth and convex. */
function lbfgs(
  fn: (x: Float64Array, g: Float64Array) => number,
  x0: Float64Array,
  { m = 10, maxIter = 3000, gtol = 1e-6 } = {}
): Float64Array {
  const P = x0.length
  let x = x0.slice()
  let g = new Float64Array(P)
  let f = fn(x, g)
  const S: Float64Array[] = []
  const Y: Float64Array[] = []
  const rho: number[] = []
  const dot = (a: Float64Array, b: Float64Array) => {
    let s = 0
    for (let i = 0; i < a.length; i++) s += a[i] * b[i]
    return s
  }
  const maxAbs = (a: Float64Array) => {
    let s = 0
    for (let i = 0; i < a.length; i++) if (Math.abs(a[i]) > s) s = Math.abs(a[i])
    return s
  }

  for (let iter = 0; iter < maxIter; iter++) {
    if (maxAbs(g) < gtol) break
    // Two-loop recursion: d = −H·g
    const q = g.slice()
    const alpha: number[] = []
    for (let k = S.length - 1; k >= 0; k--) {
      alpha[k] = rho[k] * dot(S[k], q)
      for (let i = 0; i < P; i++) q[i] -= alpha[k] * Y[k][i]
    }
    const gamma = S.length ? dot(S[S.length - 1], Y[Y.length - 1]) / dot(Y[Y.length - 1], Y[Y.length - 1]) : 1 / Math.max(1e-12, Math.sqrt(dot(g, g)))
    for (let i = 0; i < P; i++) q[i] *= gamma
    for (let k = 0; k < S.length; k++) {
      const beta = rho[k] * dot(Y[k], q)
      for (let i = 0; i < P; i++) q[i] += S[k][i] * (alpha[k] - beta)
    }
    const d = q.map(v => -v)
    let dg = dot(d, g)
    if (dg >= 0) {
      // Not a descent direction: restart from steepest descent
      S.length = Y.length = rho.length = 0
      for (let i = 0; i < P; i++) d[i] = -g[i]
      dg = dot(d, g)
    }

    let step = 1
    const xNew = new Float64Array(P)
    const gNew = new Float64Array(P)
    let fNew = Infinity
    for (let ls = 0; ls < 50; ls++) {
      for (let i = 0; i < P; i++) xNew[i] = x[i] + step * d[i]
      fNew = fn(xNew, gNew)
      if (fNew <= f + 1e-4 * step * dg) break
      step *= 0.5
    }
    if (!(fNew < f) && Math.abs(f - fNew) < 1e-16) break

    const s = new Float64Array(P)
    const yv = new Float64Array(P)
    for (let i = 0; i < P; i++) {
      s[i] = xNew[i] - x[i]
      yv[i] = gNew[i] - g[i]
    }
    const sy = dot(s, yv)
    if (sy > 1e-12) {
      S.push(s)
      Y.push(yv)
      rho.push(1 / sy)
      if (S.length > m) {
        S.shift()
        Y.shift()
        rho.shift()
      }
    }
    const converged = Math.abs(f - fNew) <= 1e-15 * Math.max(1, Math.abs(f))
    x = xNew.slice()
    g = gNew.slice()
    f = fNew
    if (converged) break
  }
  return x
}

function predictProba(model: LinearModel, x: Sparse): number[] {
  const z = model.coef.map((row, r) => {
    let s = model.intercept[r]
    for (let k = 0; k < x.idx.length; k++) s += row[x.idx[k]] * x.val[k]
    return s
  })
  if (model.classes.length === 2) {
    const p1 = 1 / (1 + Math.exp(-z[0]))
    return [1 - p1, p1]
  }
  const max = Math.max(...z)
  const e = z.map(v => Math.exp(v - max))
  const sum = e.reduce((a, b) => a + b, 0)
  return e.map(v => v / sum)
}

interface FittedPipeline {
  vec: Tfidf
  model: LinearModel
}

function fitPipeline(docs: GramCounts[], labels: string[], cfg: TrainerConfig): FittedPipeline {
  const vec = fitTfidf(docs, cfg.ngramRange)
  const X = docs.map(d => transform(d, vec))
  return { vec, model: fitLogReg(X, labels, vec.terms.length, cfg.C) }
}

/** Probabilities aligned to `classes` (a class unseen by this pipeline gets 0, like cross_val_predict). */
function pipelineProba(p: FittedPipeline, doc: GramCounts, classes: string[]): number[] {
  const probs = predictProba(p.model, transform(doc, p.vec))
  return classes.map(c => {
    const i = p.model.classes.indexOf(c)
    return i >= 0 ? probs[i] : 0
  })
}

// ── Metrics (scikit-learn definitions, zero_division=0) ──────────────────────

const round4 = (x: number) => Math.round(x * 10000) / 10000
const argmax = (a: number[]) => a.reduce((best, v, i) => (v > a[best] ? i : best), 0)

function classificationReport(yTrue: string[], yPred: string[], labels: string[]) {
  const report: Record<string, any> = {}
  let mp = 0, mr = 0, mf = 0, wp = 0, wr = 0, wf = 0
  for (const l of labels) {
    const tp = yTrue.filter((t, i) => t === l && yPred[i] === l).length
    const predN = yPred.filter(p => p === l).length
    const support = yTrue.filter(t => t === l).length
    const precision = predN ? tp / predN : 0
    const recall = support ? tp / support : 0
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
    report[l] = { precision, recall, 'f1-score': f1, support }
    mp += precision; mr += recall; mf += f1
    wp += precision * support; wr += recall * support; wf += f1 * support
  }
  const n = yTrue.length
  const k = labels.length
  report.accuracy = yTrue.filter((t, i) => t === yPred[i]).length / n
  report['macro avg'] = { precision: mp / k, recall: mr / k, 'f1-score': mf / k, support: n }
  report['weighted avg'] = { precision: wp / n, recall: wr / n, 'f1-score': wf / n, support: n }
  return report
}

function summary(yTrue: string[], yPred: string[], labels: string[]) {
  const r = classificationReport(yTrue, yPred, labels)
  return {
    accuracy: round4(r.accuracy),
    macroPrecision: round4(r['macro avg'].precision),
    macroRecall: round4(r['macro avg'].recall),
    macroF1: round4(r['macro avg']['f1-score']),
  }
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Training + evaluation → artifact ─────────────────────────────────────────

export interface TrainResult {
  artifact: TrainedModelArtifact & { trainer: string; datasetFingerprint?: string }
  skippedGenres: string[]
  durationMs: number
}

/** Genres with fewer than the minimum number of verified examples cannot be learned yet. */
export function usableRows(rows: TrainingRow[], minExamples: number): { rows: TrainingRow[]; skippedGenres: string[] } {
  const counts = new Map<string, number>()
  rows.forEach(r => counts.set(r.genre, (counts.get(r.genre) || 0) + 1))
  const skippedGenres = Array.from(counts).filter(([, c]) => c < minExamples).map(([g]) => g)
  return { rows: rows.filter(r => !skippedGenres.includes(r.genre)), skippedGenres }
}

export function trainGenreModel(allRows: TrainingRow[], cfg: TrainerConfig = DEFAULT_TRAINER_CONFIG, version?: string): TrainResult {
  const started = Date.now()
  const { rows, skippedGenres } = usableRows(allRows, cfg.minExamplesPerGenre)
  const classes = Array.from(new Set(rows.map(r => r.genre))).sort()
  if (classes.length < 2) throw new Error('At least 2 genres with enough verified examples are needed to train')

  const { answerRegex, stripRegex } = buildPreprocessRegexes(cfg.preprocessing)
  const prep = (r: Record<string, string | null | undefined>) => preprocessText(r, cfg.preprocessing.fields, answerRegex, stripRegex)
  const X = rows.map(r => countGrams(prep(r as any), cfg.ngramRange))
  const y = rows.map(r => r.genre)
  const n = rows.length

  // 1. Leave-One-Out Cross-Validation (the pipeline is refit on every fold, like cross_val_predict)
  const proba = X.map((_, i) => {
    const tr = X.map((_, j) => j).filter(j => j !== i)
    return pipelineProba(fitPipeline(tr.map(j => X[j]), tr.map(j => y[j]), cfg), X[i], classes)
  })
  const pred = proba.map(p => classes[argmax(p)])
  const topP = proba.map(p => Math.max(...p))
  const report = classificationReport(y, pred, classes)
  const majorityCount = Math.max(...classes.map(c => y.filter(v => v === c).length))
  const covered = topP.map(p => p >= cfg.unclassifiedThreshold)
  const coveredIdx = covered.map((c, i) => (c ? i : -1)).filter(i => i >= 0)
  const covAcc = coveredIdx.length ? coveredIdx.filter(i => pred[i] === y[i]).length / coveredIdx.length : 0
  const matrix = classes.map(t => classes.map(p => y.filter((v, i) => v === t && pred[i] === p).length))

  // 2. Rule-based + ML (the system's actual decision) and rules alone
  let combined: Record<string, any> = {}
  if (rows.every(r => r.ruleScores && typeof r.ruleScores === 'object')) {
    const Rm = rows.map(r => classes.map(c => r.ruleScores![c] ?? 0))
    const blend = Rm.map((rr, i) => rr.map((v, k) => cfg.ruleWeight * v + (1 - cfg.ruleWeight) * proba[i][k]))
    const rulePred = Rm.map(rr => classes[argmax(rr)])
    const blendPred = blend.map(b => classes[argmax(b)])
    const answered = blend.map(b => Math.max(...b) >= cfg.unclassifiedThreshold)
    const ansIdx = answered.map((a, i) => (a ? i : -1)).filter(i => i >= 0)
    combined = {
      ruleBasedPlusML: {
        ...summary(y, blendPred, classes),
        ruleWeight: cfg.ruleWeight,
        coverageAtThreshold: round4(ansIdx.length / n),
        accuracyOnAnswered: ansIdx.length ? round4(ansIdx.filter(i => blendPred[i] === y[i]).length / ansIdx.length) : null,
      },
      rulesOnly: summary(y, rulePred, classes),
    }
  }

  // 3. Learning curve: accuracy on unseen entries as the number of training entries grows
  const rng = mulberry32(cfg.seed)
  const learningCurve: { trainSize: number; accuracy: number }[] = []
  const stepSize = Math.max(1, Math.floor(n / 10))
  for (let size = Math.max(classes.length, 4); size < n - 1; size += stepSize) {
    const scores: number[] = []
    for (let rep = 0; rep < cfg.learningCurveRepeats; rep++) {
      const perm = X.map((_, i) => i)
      for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[perm[i], perm[j]] = [perm[j], perm[i]]
      }
      const train = perm.slice(0, size)
      const test = perm.slice(size)
      if (new Set(train.map(i => y[i])).size < 2) continue
      const p = fitPipeline(train.map(i => X[i]), train.map(i => y[i]), cfg)
      const correct = test.filter(i => p.model.classes[argmax(predictProba(p.model, transform(X[i], p.vec)))] === y[i]).length
      scores.push(correct / test.length)
    }
    if (scores.length) learningCurve.push({ trainSize: size, accuracy: round4(scores.reduce((a, b) => a + b, 0) / scores.length) })
  }

  // 4. Final model on all verified entries
  const final = fitPipeline(X, y, cfg)
  const sig = (x: number) => Number(x.toPrecision(9))
  const topFeatures: Record<string, { feature: string; weight: number }[]> = {}
  classes.forEach((genre, k) => {
    const row = classes.length > 2 ? final.model.coef[k] : final.model.coef[0].map(v => (k === 1 ? v : -v))
    topFeatures[genre] = Array.from(row.keys())
      .sort((a, b) => row[b] - row[a])
      .slice(0, 15)
      .map(i => ({ feature: final.vec.terms[i], weight: round4(row[i]) }))
  })

  // Parity probes: the app's inference code must reproduce these probabilities from the stored artifact
  const probeInputs: Record<string, string>[] = [
    ...rows.slice(0, Math.min(8, n)).map(r => ({ transcription: r.transcription || '', translation: r.translation || '' })),
    { transcription: 'Unsa kini? Tu maintok pad, pag aslag un', translation: '' },
    { transcription: '', translation: 'Once upon a time a monkey and a crocodile lived by the river.' },
    { transcription: "Da'an og-ilaan — ÑAÑA kan bata!! -- 'kuna' 2024\nTigmo: unsa? Answer: lubi", translation: 'A riddle (Maravilla 2024).' },
  ]

  const now = new Date()
  const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
  const artifact: TrainResult['artifact'] = {
    format: ARTIFACT_FORMAT,
    version: version || `auto-${stamp}`,
    createdAt: now.toISOString(),
    algorithm: 'Character n-gram TF-IDF (3-5, char_wb) + Logistic Regression',
    trainer: 'In-app automatic retraining (same algorithm as the Colab notebook)',
    classes,
    preprocessing: cfg.preprocessing,
    vectorizers: [
      { name: 'char', analyzer: 'char_wb', ngramRange: cfg.ngramRange, sublinearTf: true, terms: final.vec.terms, idf: Array.from(final.vec.idf, sig) },
    ],
    coef: final.model.coef.map(r => Array.from(r, sig)),
    intercept: Array.from(final.model.intercept, sig),
    unclassifiedThreshold: cfg.unclassifiedThreshold,
    trainedSamples: n,
    classCounts: Object.fromEntries(classes.map(c => [c, y.filter(v => v === c).length])),
    metrics: {
      evaluation: 'LOOCV',
      accuracy: round4(report.accuracy),
      macroF1: round4(report['macro avg']['f1-score']),
      majorityBaseline: round4(majorityCount / n),
      coverageAtThreshold: round4(coveredIdx.length / n),
      accuracyOnCovered: round4(covAcc),
      perClass: report,
      confusionMatrix: { labels: classes, matrix },
      learningCurve,
      ...combined,
    },
    topFeatures,
    parityTests: probeInputs.map(input => ({ input, probabilities: pipelineProba(final, countGrams(prep(input), cfg.ngramRange), classes) })),
  }

  return { artifact, skippedGenres, durationMs: Date.now() - started }
}
