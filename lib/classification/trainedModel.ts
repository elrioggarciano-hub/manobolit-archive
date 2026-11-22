// Trained Model Runtime (inference only)
// The genre classifier is TRAINED in Google Colab (notebooks/ManoboLit_Genre_Classifier_Trainer.ipynb)
// with scikit-learn on human-verified archive entries, exported as a JSON artifact, uploaded by an admin,
// and stored in the MLModelRegistry table. This file contains NO vocabulary or keywords: every term,
// IDF value and weight comes from the uploaded artifact. It only re-implements scikit-learn's
// TfidfVectorizer (word / char_wb) + linear model (LogisticRegression) inference so it can run on Vercel.
// Each artifact carries parity tests (inputs + sklearn probabilities) that must be reproduced on upload.

import { prisma } from '../database/prisma'

export const ARTIFACT_FORMAT = 'manobolit-sklearn-linear-v1'
const SUPPORTED_TOKEN_PATTERN = "(?u)\\b[\\w'-]+\\b"
export const PARITY_TOLERANCE = 1e-4

export interface VectorizerArtifact {
  name: string
  analyzer: 'word' | 'char_wb'
  ngramRange: [number, number]
  sublinearTf: boolean
  tokenPattern?: string
  terms: string[]
  idf: number[]
}

export interface TrainedModelArtifact {
  format: typeof ARTIFACT_FORMAT
  version: string
  createdAt: string
  algorithm: string
  classes: string[]
  preprocessing: {
    fields: string[]
    answerMarkers: string[]
    stripTerms: string[]
  }
  vectorizers: VectorizerArtifact[]
  coef: number[][]
  intercept: number[]
  unclassifiedThreshold: number
  trainedSamples: number
  classCounts: Record<string, number>
  metrics: Record<string, any>
  topFeatures?: Record<string, { feature: string; weight: number }[]>
  parityTests: { input: Record<string, string>; probabilities: number[] }[]
}

interface CompiledVectorizer extends VectorizerArtifact {
  index: Map<string, number>
  offset: number
}

export interface CompiledModel {
  artifact: TrainedModelArtifact
  vectorizers: CompiledVectorizer[]
  answerRegex: RegExp | null
  stripRegex: RegExp | null
}

export interface TrainedPrediction {
  genre: string
  confidence: number
  probabilities: { genre: string; probability: number }[]
  isUnclassified: boolean
  modelVersion: string
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Mirrors the notebook's preprocess() exactly. */
export function preprocessForModel(input: Record<string, string | null | undefined>, model: CompiledModel): string {
  const fields = model.artifact.preprocessing.fields
  let text = fields.map(f => (input[f] || '').toString()).filter(Boolean).join(' ')
  if (model.answerRegex) text = text.replace(model.answerRegex, ' ')
  if (model.stripRegex) text = text.replace(model.stripRegex, ' ')
  text = text.toLowerCase().replace(/\r/g, ' ').replace(/\n/g, ' ')
  // Python: re.sub(r"[^\w\s\-\']", " ", text) with Unicode \w = letters, numbers, underscore
  text = text.replace(/[^\p{L}\p{N}_\s\-']/gu, ' ')
  return text.replace(/\s+/g, ' ').trim()
}

const isWordChar = (ch: string) => /[\p{L}\p{N}_]/u.test(ch)

/** Equivalent of scikit-learn token_pattern r"(?u)\b[\w'-]+\b" */
function tokenize(text: string): string[] {
  const tokens: string[] = []
  for (const run of text.match(/[\p{L}\p{N}_'-]+/gu) || []) {
    const chars = Array.from(run)
    let s = 0
    let e = chars.length
    while (s < e && !isWordChar(chars[s])) s++
    while (e > s && !isWordChar(chars[e - 1])) e--
    if (e > s) tokens.push(chars.slice(s, e).join(''))
  }
  return tokens
}

/** scikit-learn _word_ngrams */
function wordNgrams(tokens: string[], [minN, maxN]: [number, number]): string[] {
  const out: string[] = []
  for (let n = minN; n <= Math.min(maxN, tokens.length); n++) {
    for (let i = 0; i + n <= tokens.length; i++) out.push(tokens.slice(i, i + n).join(' '))
  }
  return out
}

/** scikit-learn _char_wb_ngrams (operates on Unicode code points) */
function charWbNgrams(text: string, [minN, maxN]: [number, number]): string[] {
  const out: string[] = []
  for (const word of text.replace(/\s\s+/g, ' ').split(/\s+/).filter(Boolean)) {
    const w = Array.from(` ${word} `)
    for (let n = minN; n <= maxN; n++) {
      let offset = 0
      out.push(w.slice(offset, offset + n).join(''))
      while (offset + n < w.length) {
        offset++
        out.push(w.slice(offset, offset + n).join(''))
      }
      if (offset === 0) break // short word counted once
    }
  }
  return out
}

function vectorize(text: string, v: CompiledVectorizer): Map<number, number> {
  const grams = v.analyzer === 'word' ? wordNgrams(tokenize(text), v.ngramRange) : charWbNgrams(text, v.ngramRange)
  const counts = new Map<number, number>()
  for (const g of grams) {
    const idx = v.index.get(g)
    if (idx !== undefined) counts.set(idx, (counts.get(idx) || 0) + 1)
  }
  let sumSq = 0
  const vec = new Map<number, number>()
  for (const [idx, c] of counts) {
    const tf = v.sublinearTf ? 1 + Math.log(c) : c
    const w = tf * v.idf[idx]
    vec.set(idx, w)
    sumSq += w * w
  }
  const norm = Math.sqrt(sumSq)
  if (norm > 0) for (const [idx, w] of vec) vec.set(idx, w / norm)
  return vec
}

/** Validates structure and compiles lookup tables. Throws on an invalid artifact. */
export function compileArtifact(raw: any): CompiledModel {
  const a = raw as TrainedModelArtifact
  if (!a || a.format !== ARTIFACT_FORMAT) throw new Error(`Unsupported model format (expected ${ARTIFACT_FORMAT})`)
  if (!Array.isArray(a.classes) || a.classes.length < 2) throw new Error('Model must have at least 2 classes')
  if (!Array.isArray(a.vectorizers) || a.vectorizers.length === 0) throw new Error('Model has no vectorizers')

  let offset = 0
  const vectorizers: CompiledVectorizer[] = a.vectorizers.map(v => {
    if (v.analyzer !== 'word' && v.analyzer !== 'char_wb') throw new Error(`Unsupported analyzer ${v.analyzer}`)
    if (v.analyzer === 'word' && v.tokenPattern !== SUPPORTED_TOKEN_PATTERN) throw new Error(`Unsupported token pattern ${v.tokenPattern}`)
    if (v.terms.length !== v.idf.length) throw new Error(`Vectorizer ${v.name}: terms/idf length mismatch`)
    const compiled = { ...v, index: new Map(v.terms.map((t, i) => [t, i])), offset }
    offset += v.terms.length
    return compiled
  })

  const rows = a.classes.length === 2 ? 1 : a.classes.length
  if (a.coef.length !== rows || a.intercept.length !== rows) throw new Error('Coefficient shape does not match classes')
  if (a.coef.some(r => r.length !== offset)) throw new Error('Coefficient width does not match vocabulary size')

  // Python's \b is Unicode-aware; emulate it with Unicode lookarounds.
  const B_START = '(?<![\\p{L}\\p{N}_])'
  const B_END = '(?![\\p{L}\\p{N}_])'
  const p = a.preprocessing
  const answerRegex = p.answerMarkers?.length
    ? new RegExp(`${B_START}(?:${p.answerMarkers.map(escapeRegex).join('|')})${B_END}\\s*:[^\\n\\r]*`, 'giu')
    : null
  const stripRegex = p.stripTerms?.length
    ? new RegExp(
        `${B_START}(?:${[...p.stripTerms].sort((x, y) => y.length - x.length).map(t => escapeRegex(t).replace(/ /g, '\\s*')).join('|')})${B_END}`,
        'giu'
      )
    : null

  return { artifact: a, vectorizers, answerRegex, stripRegex }
}

export function predictWithCompiled(model: CompiledModel, input: Record<string, string | null | undefined>): TrainedPrediction {
  const a = model.artifact
  const text = preprocessForModel(input, model)
  const scores = a.intercept.slice()
  for (const v of model.vectorizers) {
    for (const [idx, w] of vectorize(text, v)) {
      for (let k = 0; k < scores.length; k++) scores[k] += a.coef[k][v.offset + idx] * w
    }
  }

  let probs: number[]
  if (a.classes.length === 2) {
    const p1 = 1 / (1 + Math.exp(-scores[0]))
    probs = [1 - p1, p1]
  } else {
    const max = Math.max(...scores)
    const exps = scores.map(s => Math.exp(s - max))
    const sum = exps.reduce((x, y) => x + y, 0)
    probs = exps.map(e => e / sum)
  }

  const ranked = a.classes.map((genre, i) => ({ genre, probability: probs[i] })).sort((x, y) => y.probability - x.probability)
  const top = ranked[0]
  const isUnclassified = !text || top.probability < a.unclassifiedThreshold
  return {
    genre: isUnclassified ? 'UNCLASSIFIED' : top.genre,
    confidence: Math.round(top.probability * 1000) / 1000,
    probabilities: a.classes.map((genre, i) => ({ genre, probability: probs[i] })),
    isUnclassified,
    modelVersion: a.version,
  }
}

/** Re-runs the notebook's parity tests; returns the largest probability difference. */
export function runParityTests(model: CompiledModel): { passed: boolean; maxDiff: number; count: number } {
  const tests = model.artifact.parityTests || []
  if (tests.length === 0) return { passed: false, maxDiff: Infinity, count: 0 }
  let maxDiff = 0
  for (const t of tests) {
    const got = predictWithCompiled(model, t.input).probabilities.map(p => p.probability)
    t.probabilities.forEach((p, i) => (maxDiff = Math.max(maxDiff, Math.abs(p - got[i]))))
  }
  return { passed: maxDiff <= PARITY_TOLERANCE, maxDiff, count: tests.length }
}

// ── Active model loading (database) ──────────────────────────────────────────

const CHECK_INTERVAL_MS = 30_000
let cached: { key: string; model: CompiledModel } | null = null
let lastCheck = 0
let inflight: Promise<CompiledModel | null> | null = null

/** Returns the active Colab-trained model from the database, or null if none is uploaded. */
export async function getActiveTrainedModel(): Promise<CompiledModel | null> {
  if (cached && Date.now() - lastCheck < CHECK_INTERVAL_MS) return cached.model
  if (inflight) return inflight

  inflight = (async () => {
    try {
      lastCheck = Date.now()
      const head = await prisma.mLModelRegistry.findFirst({
        where: { status: 'ACTIVE', artifact: { not: null } },
        select: { id: true, version: true, activatedAt: true },
        orderBy: { activatedAt: 'desc' },
      })
      if (!head) {
        cached = null
        return null
      }
      const key = `${head.id}:${head.activatedAt?.getTime() ?? 0}`
      if (cached?.key === key) return cached.model

      const row = await prisma.mLModelRegistry.findUnique({ where: { id: head.id }, select: { artifact: true } })
      const model = compileArtifact(JSON.parse(row!.artifact!))
      cached = { key, model }
      console.log(`[TrainedModel] Loaded ${model.artifact.version} (${model.artifact.trainedSamples} samples).`)
      return model
    } catch (err: any) {
      console.warn('[TrainedModel] Could not load active trained model:', err.message)
      return cached?.model ?? null
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function invalidateTrainedModelCache() {
  cached = null
  lastCheck = 0
}
