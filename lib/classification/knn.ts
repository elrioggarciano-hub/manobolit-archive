// k-Nearest-Neighbor Exemplar Memory
// Instance-based learning: every human-verified entry is stored as an exemplar.
// A new text is compared (cosine similarity over character 3-5-gram TF-IDF vectors)
// against all exemplars; the k most similar vote for their genre, weighted by similarity.
// Suited to low-resource settings: each newly verified entry is usable immediately,
// and every prediction can be explained by pointing at the concrete neighbors.

import { TrainingDocument, ACTIVE_GENRES } from './trainingCorpus'
import { extractWordBoundedCharNgrams } from './charNgram'
import { cleanClassificationText } from './textCleaning'

type SparseVec = Record<string, number>

export interface KnnExemplar {
  id: string
  genre: string
  vector: SparseVec
}

export interface KnnModel {
  exemplars: KnnExemplar[]
  dfMap: Map<string, number>
  totalDocuments: number
  k: number
}

export interface KnnNeighbor {
  id: string
  genre: string
  similarity: number
}

export interface KnnResult {
  predictedGenre: string
  confidence: number
  allGenreScores: { genre: string; score: number }[]
  neighbors: KnnNeighbor[]
}

export const DEFAULT_K = 3

function idf(model: Pick<KnnModel, 'dfMap' | 'totalDocuments'>, gram: string): number {
  const df = model.dfMap.get(gram) || 0
  return Math.log(1 + model.totalDocuments / (1 + df)) + 1.0
}

function vectorize(text: string, model: Pick<KnnModel, 'dfMap' | 'totalDocuments'>): SparseVec {
  const grams = extractWordBoundedCharNgrams(cleanClassificationText(text))
  const counts = new Map<string, number>()
  for (const g of grams) counts.set(g, (counts.get(g) || 0) + 1)

  const vec: SparseVec = {}
  let sumSq = 0
  for (const [g, c] of counts) {
    const w = (1 + Math.log(c)) * idf(model, g)
    vec[g] = w
    sumSq += w * w
  }
  const mag = Math.sqrt(sumSq) || 1
  for (const g of Object.keys(vec)) vec[g] /= mag
  return vec
}

function cosine(a: SparseVec, b: SparseVec): number {
  // Iterate over the smaller vector
  const [small, large] = Object.keys(a).length < Object.keys(b).length ? [a, b] : [b, a]
  let dot = 0
  for (const [g, w] of Object.entries(small)) {
    const v = large[g]
    if (v !== undefined) dot += w * v
  }
  return Math.max(0, Math.min(1, dot))
}

/**
 * Builds the exemplar memory from training documents (active genres only).
 */
export function trainKnn(docs: TrainingDocument[], k: number = DEFAULT_K): KnnModel {
  const active = docs.filter(d => (ACTIVE_GENRES as readonly string[]).includes(d.genre))
  const dfMap = new Map<string, number>()
  const gramSets = active.map(d => new Set(extractWordBoundedCharNgrams(cleanClassificationText(d.text))))
  for (const set of gramSets) for (const g of set) dfMap.set(g, (dfMap.get(g) || 0) + 1)

  const base = { dfMap, totalDocuments: active.length }
  const exemplars = active.map(d => ({ id: d.id, genre: d.genre, vector: vectorize(d.text, base) }))
  return { exemplars, dfMap, totalDocuments: active.length, k }
}

/**
 * Classifies by similarity-weighted vote of the k nearest exemplars.
 * Genre score = sum of neighbor similarities for that genre / sum of all neighbor similarities.
 */
export function classifyWithKnn(text: string, model: KnnModel, targetGenreFilter: string = 'ALL'): KnnResult {
  const genres = (ACTIVE_GENRES as readonly string[]).filter(g => targetGenreFilter === 'ALL' || g === targetGenreFilter)
  const empty: KnnResult = {
    predictedGenre: 'UNCLASSIFIED',
    confidence: 0,
    allGenreScores: genres.map(genre => ({ genre, score: 0 })),
    neighbors: [],
  }
  if (!model || model.exemplars.length === 0) return empty

  const query = vectorize(text, model)
  if (Object.keys(query).length === 0) return empty

  const neighbors: KnnNeighbor[] = model.exemplars
    .filter(e => genres.includes(e.genre))
    .map(e => ({ id: e.id, genre: e.genre, similarity: cosine(query, e.vector) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, model.k)
    .filter(n => n.similarity > 0)

  const total = neighbors.reduce((s, n) => s + n.similarity, 0)
  if (total === 0) return empty

  const allGenreScores = genres
    .map(genre => ({
      genre,
      score: neighbors.filter(n => n.genre === genre).reduce((s, n) => s + n.similarity, 0) / total,
    }))
    .sort((a, b) => b.score - a.score)

  return {
    predictedGenre: allGenreScores[0].genre,
    confidence: Math.round(allGenreScores[0].score * 1000) / 1000,
    allGenreScores,
    neighbors: neighbors.map(n => ({ ...n, similarity: Math.round(n.similarity * 1000) / 1000 })),
  }
}
