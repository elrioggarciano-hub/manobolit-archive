// Supervised Machine Learning: Multinomial Naive Bayes (MNB) Classifier with Laplace Smoothing
// Formal mathematical formulation for Low-Resource Text Classification.
//
// Mathematical Formulation:
//   1. Prior Probability:
//        P(c) = ( N_c + 1 ) / ( N + |C| )
//   2. Feature Likelihood with Laplace Smoothing (alpha = 1.0):
//        P(w | c) = ( count(w, c) + alpha ) / ( total_words_in_c + alpha * |V| )
//   3. Log-Likelihood Inference:
//        log P(c | d) = ln P(c) + sum_{w in d} ln P(w | c)
//   4. Calibrated Posterior Probability (Softmax):
//        P(c | d) = exp(log P(c | d) - max_k log P(k | d)) / sum_j exp(log P(j | d) - max_k log P(k | d))

import { tokenizeUnigrams, generateWordBigrams } from './tokenizer'
import { TRAINING_CORPUS, TrainingDocument } from './trainingCorpus'

export interface NaiveBayesModel {
  classes: string[]
  vocabulary: Set<string>
  vocabularySize: number
  classCounts: Record<string, number>
  totalDocuments: number
  priors: Record<string, number> // log P(c)
  wordCountsPerClass: Record<string, Record<string, number>>
  totalWordsPerClass: Record<string, number>
  alpha: number // Laplace smoothing factor
}

export interface PredictiveFeature {
  word: string
  classLikelihood: number
  logOddsRatio: number
}

export interface NaiveBayesPrediction {
  predictedGenre: string
  posteriorProbability: number
  allProbabilities: { genre: string; probability: number; logLikelihood: number }[]
  topPredictiveFeatures: PredictiveFeature[]
  modelMetadata: {
    algorithm: string
    trainedSampleCount: number
    vocabularySize: number
    smoothingAlpha: number
  }
}

/**
 * Trains a Multinomial Naive Bayes model on a given dataset.
 */
export function trainNaiveBayes(
  trainingData: TrainingDocument[] = TRAINING_CORPUS,
  alpha: number = 1.0
): NaiveBayesModel {
  const classes = Array.from(new Set(trainingData.map(d => d.genre)))
  const vocabulary = new Set<string>()
  const classCounts: Record<string, number> = {}
  const wordCountsPerClass: Record<string, Record<string, number>> = {}
  const totalWordsPerClass: Record<string, number> = {}

  for (const c of classes) {
    classCounts[c] = 0
    wordCountsPerClass[c] = {}
    totalWordsPerClass[c] = 0
  }

  // 1. Accumulate word counts and class occurrences
  for (const doc of trainingData) {
    classCounts[doc.genre] = (classCounts[doc.genre] || 0) + 1
    const unigrams = tokenizeUnigrams(doc.text, true)
    const bigrams = generateWordBigrams(unigrams)
    const tokens = [...unigrams, ...bigrams]

    for (const token of tokens) {
      vocabulary.add(token)
      wordCountsPerClass[doc.genre][token] = (wordCountsPerClass[doc.genre][token] || 0) + 1
      totalWordsPerClass[doc.genre] += 1
    }
  }

  const totalDocuments = trainingData.length
  const numClasses = classes.length

  // 2. Compute Laplace-smoothed Log-Priors: ln P(c)
  const priors: Record<string, number> = {}
  for (const c of classes) {
    const prior = (classCounts[c] + 1) / (totalDocuments + numClasses)
    priors[c] = Math.log(prior)
  }

  return {
    classes,
    vocabulary,
    vocabularySize: vocabulary.size,
    classCounts,
    totalDocuments,
    priors,
    wordCountsPerClass,
    totalWordsPerClass,
    alpha,
  }
}

// Global trained instance (memoized for fast inference across requests)
export const DEFAULT_TRAINED_NB_MODEL: NaiveBayesModel = trainNaiveBayes(TRAINING_CORPUS, 1.0)

/**
 * Predicts the class of a text using the trained Multinomial Naive Bayes Machine Learning model.
 */
export function predictNaiveBayes(
  text: string,
  targetGenreFilter: string = 'ALL',
  model: NaiveBayesModel = DEFAULT_TRAINED_NB_MODEL
): NaiveBayesPrediction {
  const unigrams = tokenizeUnigrams(text, true)
  const bigrams = generateWordBigrams(unigrams)
  const tokens = [...unigrams, ...bigrams]

  const candidateClasses = targetGenreFilter === 'ALL'
    ? model.classes
    : model.classes.filter(c => c === targetGenreFilter)

  const logLikelihoods: Record<string, number> = {}
  const wordContributions: Record<string, PredictiveFeature[]> = {}

  for (const c of candidateClasses) {
    let logProb = model.priors[c] || Math.log(1 / model.classes.length)
    const totalWords = model.totalWordsPerClass[c] || 0
    const denominator = totalWords + model.alpha * model.vocabularySize
    const features: PredictiveFeature[] = []

    for (const token of tokens) {
      if (model.vocabulary.has(token)) {
        const count = model.wordCountsPerClass[c]?.[token] || 0
        // Likelihood with Laplace smoothing
        const likelihood = (count + model.alpha) / denominator
        logProb += Math.log(likelihood)

        // Calculate other classes count for log-odds ratio
        let otherCount = 0
        let otherTotal = 0
        for (const oc of model.classes) {
          if (oc !== c) {
            otherCount += model.wordCountsPerClass[oc]?.[token] || 0
            otherTotal += model.totalWordsPerClass[oc] || 0
          }
        }
        const otherLikelihood = (otherCount + model.alpha) / (otherTotal + model.alpha * model.vocabularySize)
        const logOdds = Math.log(likelihood / otherLikelihood)

        features.push({
          word: token,
          classLikelihood: Math.round(likelihood * 10000) / 10000,
          logOddsRatio: Math.round(logOdds * 100) / 100,
        })
      }
    }

    logLikelihoods[c] = logProb
    features.sort((a, b) => b.logOddsRatio - a.logOddsRatio)
    wordContributions[c] = features
  }

  // 3. Calibrated Softmax Normalization
  const logValues = candidateClasses.map(c => logLikelihoods[c])
  const maxLog = Math.max(...logValues)
  let sumExp = 0
  const expValues: Record<string, number> = {}

  for (const c of candidateClasses) {
    const expVal = Math.exp(logLikelihoods[c] - maxLog)
    expValues[c] = expVal
    sumExp += expVal
  }

  const allProbabilities = candidateClasses.map(c => {
    const prob = sumExp > 0 ? expValues[c] / sumExp : 1 / candidateClasses.length
    return {
      genre: c,
      probability: Math.round(prob * 1000) / 1000,
      logLikelihood: Math.round(logLikelihoods[c] * 100) / 100,
    }
  })

  allProbabilities.sort((a, b) => b.probability - a.probability)

  const topPrediction = allProbabilities[0] || { genre: 'MYTH', probability: 0, logLikelihood: 0 }
  const topFeatures = wordContributions[topPrediction.genre]?.slice(0, 5) || []

  return {
    predictedGenre: topPrediction.genre,
    posteriorProbability: topPrediction.probability,
    allProbabilities,
    topPredictiveFeatures: topFeatures,
    modelMetadata: {
      algorithm: 'Multinomial Naive Bayes (Supervised ML)',
      trainedSampleCount: model.totalDocuments,
      vocabularySize: model.vocabularySize,
      smoothingAlpha: model.alpha,
    },
  }
}
