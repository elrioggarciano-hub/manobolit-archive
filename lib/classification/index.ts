export { classifyEntry } from './engine'
export type { ClassificationResult, RuleDetail, MatchedTerm, EntryLike } from './engine'

export { genreRules, themeRules, locationRules } from './rules'
export type { ClassificationRule } from './rules'

export { classifyHybrid } from './hybrid'
export type { AlgorithmMode, HybridClassificationResult, ModelScoreBreakdown, InjectableModels } from './hybrid'

// 1. Supervised Machine Learning: Multinomial Naive Bayes
export { trainNaiveBayes, predictNaiveBayes, DEFAULT_TRAINED_NB_MODEL } from './naiveBayes'
export type { NaiveBayesModel, NaiveBayesPrediction, PredictiveFeature } from './naiveBayes'

// 2. Character N-Gram TF-IDF Centroid Model (3-5-grams per word)
export {
  trainCharNgram,
  classifyWithCharNgram,
  extractWordBoundedCharNgrams,
  DEFAULT_CHAR_NGRAM_MODEL,
} from './charNgram'
export type { CharNgramModel, CharNgramResult, CharNgramCentroid } from './charNgram'

// 3. Statistical Information Retrieval: TF-IDF Vector Space Model
export {
  classifyWithVSM,
  textToTFIDFVector,
  computeCosineSimilarity,
  getIDF,
  trainTfidf,
  legacyRuleLexiconCentroids,
  DEFAULT_TFIDF_MODEL,
} from './tfidf'
export type { VSMResult, FeatureWeight, VSMScore, TFIDFVector, TfidfModel, ClassCentroid } from './tfidf'

// 4. Dialect-Aware Orthographic Matching: Fuzzy Normalization
export {
  levenshteinDistance,
  levenshteinSimilarity,
  charDiceSimilarity,
  findOrthographicDialectMatches,
  MANOBO_DIALECT_VARIANTS,
} from './fuzzy'
export type { FuzzyMatchResult, DialectVariant } from './fuzzy'

export { normalizeText, tokenizeUnigrams, generateWordBigrams, generateCharNgrams, STOPWORDS } from './tokenizer'

export { TRAINING_CORPUS, ACTIVE_GENRES, ALL_GENRES } from './trainingCorpus'
export type { TrainingDocument, ActiveGenre, AllGenre, TrainingDocSource } from './trainingCorpus'

export {
  stripRiddleAnswer,
  stripGenreDescriptors,
  cleanClassificationText,
  getCleanClassificationInput,
} from './textCleaning'

export { computeAccuracyMetrics, computeComparativeMetrics } from './metrics'
export type { AccuracyMetrics, ModelComparisonReport, ScorableEntry } from './metrics'
