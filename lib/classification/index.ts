export { classifyEntry } from './engine'
export type { ClassificationResult, RuleDetail, MatchedTerm, EntryLike } from './engine'

export { genreRules, themeRules, locationRules } from './rules'
export type { ClassificationRule } from './rules'

export { classifyHybrid } from './hybrid'
export type { AlgorithmMode, HybridClassificationResult, ModelScoreBreakdown } from './hybrid'

// 1. Supervised Machine Learning: Multinomial Naive Bayes
export { trainNaiveBayes, predictNaiveBayes, DEFAULT_TRAINED_NB_MODEL } from './naiveBayes'
export type { NaiveBayesModel, NaiveBayesPrediction, PredictiveFeature } from './naiveBayes'

// 2. Deep Learning: Neural Semantic Latent Embeddings (64-D)
export { classifyWithNeuralSemantic } from './neuralSemantic'
export type { NeuralSemanticResult } from './neuralSemantic'

// 3. Statistical Information Retrieval: TF-IDF Vector Space Model
export { classifyWithVSM, textToTFIDFVector, computeCosineSimilarity, getIDF } from './tfidf'
export type { VSMResult, FeatureWeight, VSMScore, TFIDFVector } from './tfidf'

// 4. Dialect-Aware Computational Ethnolinguistics: Fuzzy Orthography
export {
  levenshteinDistance,
  levenshteinSimilarity,
  charDiceSimilarity,
  findOrthographicDialectMatches,
  MANOBO_DIALECT_VARIANTS,
} from './fuzzy'
export type { FuzzyMatchResult, DialectVariant } from './fuzzy'

export { normalizeText, tokenizeUnigrams, generateWordBigrams, generateCharNgrams, STOPWORDS } from './tokenizer'

export { TRAINING_CORPUS } from './trainingCorpus'
export type { TrainingDocument } from './trainingCorpus'

export { computeAccuracyMetrics, computeComparativeMetrics } from './metrics'
export type { AccuracyMetrics, ModelComparisonReport, ScorableEntry } from './metrics'
