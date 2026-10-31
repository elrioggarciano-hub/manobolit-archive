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

// -----------------------------------------------------------------------------
// Pre-Compiled Corpus Profiles
// Synthesizes the Eugenio (1993) & Andress (1985) reference corpus definitions
// into class-representative training document profiles.
// -----------------------------------------------------------------------------

function buildClassCorpus(): Record<string, string[]> {
  const corpus: Record<string, string[]> = {}

  // Eugenio 1993 Genre training documents
  for (const rule of genreRules) {
    const tokens = [
      ...rule.keywords,
      ...rule.keywords, // Weight emphasis on primary keywords
      ...rule.phrases,
      ...rule.contextClues,
      rule.name,
      rule.value.toLowerCase(),
    ]
    corpus[`GENRE_${rule.value}`] = tokens
  }

  // Andress 1985 Theme training documents
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

  return corpus
}

const CLASS_CORPUS = buildClassCorpus()
const TOTAL_DOCUMENTS = Object.keys(CLASS_CORPUS).length

// -----------------------------------------------------------------------------
// Document Frequency (DF) and Inverse Document Frequency (IDF) Cache
// -----------------------------------------------------------------------------

const DF_MAP = new Map<string, number>()

// Initialize DF map from class corpus profiles
for (const [_, tokenList] of Object.entries(CLASS_CORPUS)) {
  const uniqueTermsInDoc = new Set<string>()
  for (const item of tokenList) {
    const terms = tokenizeUnigrams(item, true)
    for (const t of terms) uniqueTermsInDoc.add(t)
    const bigrams = generateWordBigrams(terms)
    for (const b of bigrams) uniqueTermsInDoc.add(b)
  }
  for (const term of uniqueTermsInDoc) {
    DF_MAP.set(term, (DF_MAP.get(term) || 0) + 1)
  }
}

/**
 * Calculates smoothed IDF for a given term.
 */
export function getIDF(term: string): number {
  const df = DF_MAP.get(term) || 0
  // Smoothed formula: ln(1 + (N / (1 + df))) + 1
  return Math.log(1 + TOTAL_DOCUMENTS / (1 + df)) + 1.0
}

/**
 * Converts raw text into a normalized TF-IDF vector + feature analysis.
 */
export function textToTFIDFVector(text: string): {
  vector: TFIDFVector
  magnitude: number
  features: FeatureWeight[]
} {
  const unigrams = tokenizeUnigrams(text, true)
  const bigrams = generateWordBigrams(unigrams)
  const allTerms = [...unigrams, ...bigrams]

  if (allTerms.length === 0) {
    return { vector: {}, magnitude: 0, features: [] }
  }

  // Calculate raw term frequencies f_{t, d}
  const termCounts = new Map<string, number>()
  for (const t of allTerms) {
    termCounts.set(t, (termCounts.get(t) || 0) + 1)
  }

  const vector: TFIDFVector = {}
  const features: FeatureWeight[] = []
  let sumSquares = 0

  for (const [term, count] of termCounts.entries()) {
    // Sublinear TF scaling: 1 + ln(count)
    const tf = 1 + Math.log(count)
    const idf = getIDF(term)
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

  // L2 Euclidean norm
  const magnitude = Math.sqrt(sumSquares)

  // Sort features by TF-IDF weight descending (most informative terms first)
  features.sort((a, b) => b.tfidf - a.tfidf)

  return { vector, magnitude, features }
}

// -----------------------------------------------------------------------------
// Pre-Compute Centroid Vectors for each Genre and Theme
// -----------------------------------------------------------------------------

interface ClassCentroid {
  key: string
  category: string
  type: 'GENRE' | 'THEME'
  vector: TFIDFVector
  magnitude: number
}

const CLASS_CENTROIDS: ClassCentroid[] = Object.entries(CLASS_CORPUS).map(([docKey, tokens]) => {
  const docText = tokens.join(' ')
  const { vector, magnitude } = textToTFIDFVector(docText)
  const isGenre = docKey.startsWith('GENRE_')
  const category = isGenre ? docKey.replace('GENRE_', '') : docKey.replace('THEME_', '')

  return {
    key: docKey,
    category,
    type: isGenre ? 'GENRE' : 'THEME',
    vector,
    magnitude,
  }
})

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
  targetGenreFilter: string = 'ALL'
): VSMResult {
  const { vector: docVec, magnitude: docMag, features } = textToTFIDFVector(text)

  const genreScores: VSMScore[] = []
  const themeScores: VSMScore[] = []

  for (const centroid of CLASS_CENTROIDS) {
    if (centroid.type === 'GENRE') {
      if (targetGenreFilter !== 'ALL' && centroid.category !== targetGenreFilter) {
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

  const topGenre = genreScores.length > 0 ? genreScores[0].category : 'MYTH'
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
