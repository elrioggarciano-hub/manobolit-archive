// Character N-Gram Classifier (3-5-grams per word with boundary markers)
// Formulated for low-resource agglutinative morphological robustness.

import { tokenizeUnigrams } from './tokenizer'
import { TRAINING_CORPUS, TrainingDocument } from './trainingCorpus'

export interface CharNgramCentroid {
  genre: string
  vector: Record<string, number>
  magnitude: number
}

export interface CharNgramResult {
  predictedGenre: string
  confidence: number
  allGenreScores: { genre: string; similarity: number }[]
  topContributingFeatures?: { gram: string; weight: number }[]
}

export interface CharNgramModel {
  centroids: CharNgramCentroid[]
  totalDocuments: number
  dfMap: Map<string, number>
  getIDF: (gram: string) => number
  classes: string[]
}

/**
 * Extracts character 3-5-grams computed PER WORD with boundary markers '^' and '$'.
 * N-grams never span across words or documents.
 */
export function extractWordBoundedCharNgrams(text: string): string[] {
  const words = tokenizeUnigrams(text, true)
  const ngrams: string[] = []

  for (const word of words) {
    if (word.length === 0) continue
    const bounded = `^${word}$`
    const len = bounded.length

    for (let n = 3; n <= 5; n++) {
      if (len >= n) {
        for (let i = 0; i <= len - n; i++) {
          ngrams.push(bounded.slice(i, i + n))
        }
      }
    }
  }

  return ngrams
}

/**
 * Trains a character N-gram model on a given training corpus.
 * Per-genre centroid = normalized sum of its document vectors.
 */
export function trainCharNgram(
  trainingDocs: TrainingDocument[] = TRAINING_CORPUS
): CharNgramModel {
  const totalDocuments = trainingDocs.length
  const dfMap = new Map<string, number>()

  // 1. Compute document frequency (DF) per document
  for (const doc of trainingDocs) {
    const docGrams = extractWordBoundedCharNgrams(doc.text)
    const uniqueGrams = new Set<string>(docGrams)
    for (const g of uniqueGrams) {
      dfMap.set(g, (dfMap.get(g) || 0) + 1)
    }
  }

  // 2. Smoothed IDF function
  const getIDF = (gram: string): number => {
    const df = dfMap.get(gram) || 0
    return Math.log(1 + totalDocuments / (1 + df)) + 1.0
  }

  // Helper to vectorize a single document
  const vectorizeDoc = (text: string): Record<string, number> => {
    const grams = extractWordBoundedCharNgrams(text)
    if (grams.length === 0) return {}

    const counts = new Map<string, number>()
    for (const g of grams) {
      counts.set(g, (counts.get(g) || 0) + 1)
    }

    const vec: Record<string, number> = {}
    let sumSq = 0

    for (const [g, count] of counts.entries()) {
      const tf = 1 + Math.log(count)
      const idf = getIDF(g)
      const weight = tf * idf
      vec[g] = weight
      sumSq += weight * weight
    }

    const mag = Math.sqrt(sumSq) || 1
    // Return L2 normalized doc vector
    const normVec: Record<string, number> = {}
    for (const [g, w] of Object.entries(vec)) {
      normVec[g] = w / mag
    }
    return normVec
  }

  // 3. Group normalized doc vectors per genre and compute centroid as normalized sum
  const genreDocVecs: Record<string, Record<string, number>[]> = {}
  for (const doc of trainingDocs) {
    if (!genreDocVecs[doc.genre]) genreDocVecs[doc.genre] = []
    genreDocVecs[doc.genre].push(vectorizeDoc(doc.text))
  }

  const classes = Object.keys(genreDocVecs)
  const centroids: CharNgramCentroid[] = []

  for (const [genre, docVecList] of Object.entries(genreDocVecs)) {
    const sumVec: Record<string, number> = {}
    for (const dVec of docVecList) {
      for (const [g, w] of Object.entries(dVec)) {
        sumVec[g] = (sumVec[g] || 0) + w
      }
    }

    let sumSq = 0
    for (const w of Object.values(sumVec)) {
      sumSq += w * w
    }
    const mag = Math.sqrt(sumSq) || 1
    const centroidVec: Record<string, number> = {}
    for (const [g, w] of Object.entries(sumVec)) {
      centroidVec[g] = w / mag
    }

    centroids.push({
      genre,
      vector: centroidVec,
      magnitude: 1.0,
    })
  }

  return {
    centroids,
    totalDocuments,
    dfMap,
    getIDF,
    classes,
  }
}

// Global default model trained on TRAINING_CORPUS
export const DEFAULT_CHAR_NGRAM_MODEL: CharNgramModel = trainCharNgram(TRAINING_CORPUS)

/**
 * Classifies an oral literature text using character 3-5-gram cosine alignment.
 */
export function classifyWithCharNgram(
  text: string,
  targetGenreFilter: string = 'ALL',
  model: CharNgramModel = DEFAULT_CHAR_NGRAM_MODEL
): CharNgramResult {
  const activeModel = model || DEFAULT_CHAR_NGRAM_MODEL
  const grams = extractWordBoundedCharNgrams(text)

  if (grams.length === 0 || activeModel.centroids.length === 0) {
    return {
      predictedGenre: targetGenreFilter !== 'ALL' ? targetGenreFilter : (activeModel.classes[0] || 'MYTH'),
      confidence: 0,
      allGenreScores: activeModel.centroids.map(c => ({ genre: c.genre, similarity: 0 })),
    }
  }

  // Vectorize query text
  const counts = new Map<string, number>()
  for (const g of grams) {
    counts.set(g, (counts.get(g) || 0) + 1)
  }

  const queryVec: Record<string, number> = {}
  let sumSq = 0
  for (const [g, count] of counts.entries()) {
    const tf = 1 + Math.log(count)
    const idf = activeModel.getIDF(g)
    const weight = tf * idf
    queryVec[g] = weight
    sumSq += weight * weight
  }

  const queryMag = Math.sqrt(sumSq) || 1
  const normQueryVec: Record<string, number> = {}
  for (const [g, w] of Object.entries(queryVec)) {
    normQueryVec[g] = w / queryMag
  }

  // Cosine similarity against each centroid
  const candidateCentroids = targetGenreFilter === 'ALL'
    ? activeModel.centroids
    : activeModel.centroids.filter(c => c.genre === targetGenreFilter)

  const scores: { genre: string; similarity: number }[] = []

  for (const c of candidateCentroids) {
    let dot = 0
    for (const [g, qw] of Object.entries(normQueryVec)) {
      const cw = c.vector[g]
      if (cw !== undefined) {
        dot += qw * cw
      }
    }
    const similarity = Math.max(0, Math.min(1, dot))
    scores.push({
      genre: c.genre,
      similarity: Math.round(similarity * 1000) / 1000,
    })
  }

  scores.sort((a, b) => b.similarity - a.similarity)
  const top = scores[0] || { genre: activeModel.classes[0] || 'MYTH', similarity: 0 }

  return {
    predictedGenre: top.genre,
    confidence: top.similarity,
    allGenreScores: scores,
  }
}
