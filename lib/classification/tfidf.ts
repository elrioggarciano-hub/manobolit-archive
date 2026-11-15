// Vector Space Model (VSM) using TF-IDF (Term Frequency - Inverse Document Frequency)
// and Cosine Similarity for Eugenio (1993) Folklore Genres & Andress (1985) Thematic Taxonomies.
//
// Mathematical Formulation:
//   1. Sublinear Term Frequency:
//        TF(t, d) = 1 + ln(f_{t, d})   if f_{t, d} > 0, else 0
//   2. Smoothed Inverse Document Frequency:
//        IDF(t, D) = ln(1 + |D| / (1 + df_t)) + 1
//   3. TF-IDF Weight:
//        W(t, d) = TF(t, d) * IDF(t, D)
//   4. Vector Normalization (L2-norm / Euclidean):
//        ||V||_2 = sqrt( sum( W_i^2 ) )
//   5. Cosine Similarity Angle:
//        cos(theta) = ( V_doc . V_class ) / ( ||V_doc||_2 * ||V_class||_2 )

import { normalizeText, tokenizeUnigrams, generateWordBigrams } from './tokenizer'
import { genreRules, themeRules } from './rules'
import { TRAINING_CORPUS, TrainingDocument, ACTIVE_GENRES } from './trainingCorpus'
import { cleanClassificationText } from './textCleaning'

export interface TFIDFVector {
  [term: string]: number
}

export interface FeatureWeight {
  term: string
  tf: number
  idf: number
  tfidf: number
}

export interface VSMScore {
  category: string
  cosineSimilarity: number
  topContributingFeatures: FeatureWeight[]
}

export interface VSMResult {
  topGenre: string
  topGenreSimilarity: number
  allGenreScores: VSMScore[]
  topThemes: VSMScore[]
  extractedFeatures: FeatureWeight[]
  documentVectorMagnitude: number
}

export interface ClassCentroid {
  key: string
  category: string
  type: 'GENRE' | 'THEME'
  vector: TFIDFVector
  magnitude: number
}

export interface TfidfModel {
  centroids: ClassCentroid[]
  totalDocuments: number
  dfMap: Map<string, number>
  getIDF: (term: string) => number
  textToVector: (text: string) => {
    vector: TFIDFVector
    magnitude: number
    features: FeatureWeight[]
  }
}

// -----------------------------------------------------------------------------
// Legacy Rule-Derived Centroids (Archival / Comparative Reference)
// -----------------------------------------------------------------------------

/**
 * Generates class centroids synthesized directly from genreRules and themeRules keywords.
 * Kept strictly for archival and comparative benchmarking; unused by default.
 */
export function legacyRuleLexiconCentroids(): ClassCentroid[] {
  const corpus: Record<string, string[]> = {}

  for (const rule of genreRules) {
    const tokens = [
      ...rule.keywords,
      ...rule.keywords,
      ...rule.phrases,
      ...rule.contextClues,
      rule.name,
      rule.value.toLowerCase(),
    ]
    corpus[`GENRE_${rule.value}`] = tokens
  }

  for (const rule of themeRules) {
    const tokens = [
      ...rule.keywords,
      ...rule.phrases,
      ...rule.contextClues,
      rule.name,
      rule.value.toLowerCase().replace(/_/g, ' '),
    ]
    corpus[`THEME_${rule.value}`] = tokens
  }

  const legacyDfMap = new Map<string, number>()
  const totalDocs = Object.keys(corpus).length

  for (const [_, tokenList] of Object.entries(corpus)) {
    const uniqueTermsInDoc = new Set<string>()
    for (const item of tokenList) {
      const terms = tokenizeUnigrams(item, true)
      for (const t of terms) uniqueTermsInDoc.add(t)
      const bigrams = generateWordBigrams(terms)
      for (const b of bigrams) uniqueTermsInDoc.add(b)
    }
    for (const term of uniqueTermsInDoc) {
      legacyDfMap.set(term, (legacyDfMap.get(term) || 0) + 1)
    }
  }

  const legacyGetIdf = (term: string) => {
    const df = legacyDfMap.get(term) || 0
    return Math.log(1 + totalDocs / (1 + df)) + 1.0
  }

  return Object.entries(corpus).map(([docKey, tokens]) => {
    const docText = tokens.join(' ')
    const unigrams = tokenizeUnigrams(docText, true)
    const bigrams = generateWordBigrams(unigrams)
    const allTerms = [...unigrams, ...bigrams]
    const termCounts = new Map<string, number>()
    for (const t of allTerms) termCounts.set(t, (termCounts.get(t) || 0) + 1)

    const vector: TFIDFVector = {}
    let sumSquares = 0
    for (const [term, count] of termCounts.entries()) {
      const tf = 1 + Math.log(count)
      const idf = legacyGetIdf(term)
      const tfidf = tf * idf
      vector[term] = tfidf
      sumSquares += tfidf * tfidf
    }
    const isGenre = docKey.startsWith('GENRE_')
    const category = isGenre ? docKey.replace('GENRE_', '') : docKey.replace('THEME_', '')
    return {
      key: docKey,
      category,
      type: isGenre ? 'GENRE' : 'THEME',
      vector,
      magnitude: Math.sqrt(sumSquares),
    }
  })
}

// -----------------------------------------------------------------------------
// Trainable Document-Derived TF-IDF Vector Space Model
// -----------------------------------------------------------------------------

/**
 * Trains a TF-IDF Vector Space Model from labeled documents only.
 * Computes empirical Document Frequency (DF), Inverse Document Frequency (IDF),
 * and normalized class centroid vectors per genre and theme.
 */
export function trainTfidf(
  trainingDocs: TrainingDocument[] = TRAINING_CORPUS
): TfidfModel {
  // Train ONLY on ACTIVE_GENRES documents (DF, IDF, and class centroids)
  const activeDocs = trainingDocs.filter(d => (ACTIVE_GENRES as readonly string[]).includes(d.genre))
  const totalDocuments = activeDocs.length
  const dfMap = new Map<string, number>()

  // 1. Calculate Document Frequency (DF) across active training documents
  for (const doc of activeDocs) {
    const cleaned = cleanClassificationText(doc.text)
    const unigrams = tokenizeUnigrams(cleaned, true)
    const bigrams = generateWordBigrams(unigrams)
    const uniqueTerms = new Set<string>([...unigrams, ...bigrams])
    for (const term of uniqueTerms) {
      dfMap.set(term, (dfMap.get(term) || 0) + 1)
    }
  }

  // 2. Smoothed IDF calculation function
  const idfFn = (term: string): number => {
    const df = dfMap.get(term) || 0
    return Math.log(1 + totalDocuments / (1 + df)) + 1.0
  }

  // 3. Document vectorization function using model's IDF
  const textToVector = (rawText: string): {
    vector: TFIDFVector
    magnitude: number
    features: FeatureWeight[]
  } => {
    const text = cleanClassificationText(rawText)
    const unigrams = tokenizeUnigrams(text, true)
    const bigrams = generateWordBigrams(unigrams)
    const allTerms = [...unigrams, ...bigrams]

    if (allTerms.length === 0) {
      return { vector: {}, magnitude: 0, features: [] }
    }

    const termCounts = new Map<string, number>()
    for (const t of allTerms) {
      termCounts.set(t, (termCounts.get(t) || 0) + 1)
    }

    const vector: TFIDFVector = {}
    const features: FeatureWeight[] = []
    let sumSquares = 0

    for (const [term, count] of termCounts.entries()) {
      const tf = 1 + Math.log(count)
      const idf = idfFn(term)
      const tfidf = tf * idf

      vector[term] = tfidf
      sumSquares += tfidf * tfidf

      features.push({
        term,
        tf: Math.round(tf * 100) / 100,
        idf: Math.round(idf * 100) / 100,
        tfidf: Math.round(tfidf * 100) / 100,
      })
    }

    const magnitude = Math.sqrt(sumSquares)
    features.sort((a, b) => b.tfidf - a.tfidf)
    return { vector, magnitude, features }
  }

  // 4. Aggregate term counts per genre and theme across individual active documents
  // (unigrams and bigrams are computed per document so they never cross document boundaries)
  const genreTermCounts: Record<string, Map<string, number>> = {}
  const themeTermCounts: Record<string, Map<string, number>> = {}

  for (const doc of activeDocs) {
    const cleaned = cleanClassificationText(doc.text)
    const docUnigrams = tokenizeUnigrams(cleaned, true)
    const docBigrams = generateWordBigrams(docUnigrams)
    const docTerms = [...docUnigrams, ...docBigrams]

    // Genre aggregation
    if (!genreTermCounts[doc.genre]) {
      genreTermCounts[doc.genre] = new Map<string, number>()
    }
    const gMap = genreTermCounts[doc.genre]
    for (const t of docTerms) {
      gMap.set(t, (gMap.get(t) || 0) + 1)
    }

    // Theme aggregation
    if (Array.isArray(doc.themes)) {
      for (const th of doc.themes) {
        if (!themeTermCounts[th]) {
          themeTermCounts[th] = new Map<string, number>()
        }
        const thMap = themeTermCounts[th]
        for (const t of docTerms) {
          thMap.set(t, (thMap.get(t) || 0) + 1)
        }
      }
    }
  }

  // Helper to build a centroid from aggregated term counts
  const buildCentroidFromCounts = (
    key: string,
    category: string,
    type: 'GENRE' | 'THEME',
    termCounts: Map<string, number>
  ): ClassCentroid => {
    const vector: TFIDFVector = {}
    let sumSquares = 0

    for (const [term, count] of termCounts.entries()) {
      const tf = 1 + Math.log(count)
      const idf = idfFn(term)
      const tfidf = tf * idf

      vector[term] = tfidf
      sumSquares += tfidf * tfidf
    }

    const magnitude = Math.sqrt(sumSquares)
    return { key, category, type, vector, magnitude }
  }

  const centroids: ClassCentroid[] = []

  // Build Genre Centroids from aggregated document term counts (active genres only)
  for (const [genre, counts] of Object.entries(genreTermCounts)) {
    if ((ACTIVE_GENRES as readonly string[]).includes(genre)) {
      centroids.push(buildCentroidFromCounts(`GENRE_${genre}`, genre, 'GENRE', counts))
    }
  }

  // Build Theme Centroids from aggregated document term counts
  for (const [theme, counts] of Object.entries(themeTermCounts)) {
    centroids.push(buildCentroidFromCounts(`THEME_${theme}`, theme, 'THEME', counts))
  }

  return {
    centroids,
    totalDocuments,
    dfMap,
    getIDF: idfFn,
    textToVector,
  }
}

// Global trained instance on default TRAINING_CORPUS
export const DEFAULT_TFIDF_MODEL: TfidfModel = trainTfidf(TRAINING_CORPUS)
export const CLASS_CENTROIDS: ClassCentroid[] = DEFAULT_TFIDF_MODEL.centroids

/**
 * Calculates smoothed IDF for a given term (defaults to global model).
 */
export function getIDF(term: string): number {
  return DEFAULT_TFIDF_MODEL.getIDF(term)
}

/**
 * Converts raw text into a normalized TF-IDF vector + feature analysis (defaults to global model).
 */
export function textToTFIDFVector(text: string): {
  vector: TFIDFVector
  magnitude: number
  features: FeatureWeight[]
} {
  return DEFAULT_TFIDF_MODEL.textToVector(text)
}

/**
 * Computes Cosine Similarity between document vector and class centroid vector.
 * Cosine(A, B) = (A . B) / ( ||A||_2 * ||B||_2 )
 */
export function computeCosineSimilarity(
  docVector: TFIDFVector,
  docMagnitude: number,
  classVector: TFIDFVector,
  classMagnitude: number
): { similarity: number; sharedFeatures: FeatureWeight[] } {
  if (docMagnitude === 0 || classMagnitude === 0) {
    return { similarity: 0, sharedFeatures: [] }
  }

  let dotProduct = 0
  const sharedFeatures: FeatureWeight[] = []

  for (const [term, docWeight] of Object.entries(docVector)) {
    const classWeight = classVector[term]
    if (classWeight !== undefined) {
      const contribution = docWeight * classWeight
      dotProduct += contribution
      sharedFeatures.push({
        term,
        tf: Math.round(docWeight * 100) / 100,
        idf: Math.round(classWeight * 100) / 100,
        tfidf: Math.round(contribution * 100) / 100,
      })
    }
  }

  const rawCosine = dotProduct / (docMagnitude * classMagnitude)
  // Clamp between 0 and 1
  const similarity = Math.max(0, Math.min(1, rawCosine))

  sharedFeatures.sort((a, b) => b.tfidf - a.tfidf)

  return {
    similarity: Math.round(similarity * 1000) / 1000,
    sharedFeatures: sharedFeatures.slice(0, 5),
  }
}

/**
 * Classifies an input text using the Vector Space Model (TF-IDF + Cosine Similarity).
 */
export function classifyWithVSM(
  text: string,
  targetGenreFilter: string = 'ALL',
  model: TfidfModel = DEFAULT_TFIDF_MODEL
): VSMResult {
  const activeModel = model || DEFAULT_TFIDF_MODEL
  const cleanedText = cleanClassificationText(text)
  const { vector: docVec, magnitude: docMag, features } = activeModel.textToVector(cleanedText)

  const genreScores: VSMScore[] = []
  const themeScores: VSMScore[] = []
  const centroids = activeModel.centroids
  const activeGenreSet = new Set<string>(ACTIVE_GENRES)

  for (const centroid of centroids) {
    if (centroid.type === 'GENRE') {
      if (targetGenreFilter === 'ALL') {
        if (!activeGenreSet.has(centroid.category)) continue
      } else if (centroid.category !== targetGenreFilter) {
        continue
      }
      const { similarity, sharedFeatures } = computeCosineSimilarity(
        docVec,
        docMag,
        centroid.vector,
        centroid.magnitude
      )
      genreScores.push({
        category: centroid.category,
        cosineSimilarity: similarity,
        topContributingFeatures: sharedFeatures,
      })
    } else if (centroid.type === 'THEME') {
      const { similarity, sharedFeatures } = computeCosineSimilarity(
        docVec,
        docMag,
        centroid.vector,
        centroid.magnitude
      )
      if (similarity > 0.05) {
        themeScores.push({
          category: centroid.category,
          cosineSimilarity: similarity,
          topContributingFeatures: sharedFeatures,
        })
      }
    }
  }

  genreScores.sort((a, b) => b.cosineSimilarity - a.cosineSimilarity)
  themeScores.sort((a, b) => b.cosineSimilarity - a.cosineSimilarity)

  const topGenre = (genreScores.length > 0 && genreScores[0].cosineSimilarity > 0)
    ? genreScores[0].category
    : 'UNCLASSIFIED'
  const topGenreSimilarity = genreScores.length > 0 ? genreScores[0].cosineSimilarity : 0

  return {
    topGenre,
    topGenreSimilarity,
    allGenreScores: genreScores,
    topThemes: themeScores.slice(0, 4),
    extractedFeatures: features.slice(0, 10),
    documentVectorMagnitude: Math.round(docMag * 100) / 100,
  }
}
