// Interpretable Decision Tree Classifier for Philippine Indigenous Oral Literature
// Evaluates genuine structural, morphological, and oral narrative features.
//
// Key Ethnolinguistic Finding:
//   Transcription token count cleanly partitions micro-genres {RIDDLE, PROVERB}
//   from macro-genres {FOLKTALE, SONG}.

import { ScorableEntry } from './metrics'
import { tokenizeUnigrams } from './tokenizer'
import { ACTIVE_GENRES, ActiveGenre } from './trainingCorpus'

export interface OralFeatures {
  transcriptionTokens: number
  translationTokens: number
  totalTokens: number
  tokenRatio: number // transcription / translation
  hasQuestionMark: boolean
  questionCueCount: number
  proverbialCueCount: number
  narrativeCueCount: number
  lyricCueCount: number
}

const QUESTION_CUES = ['what', 'who', 'guess', 'unsa', 'kinsa', 'nukoy', 'amonohon', 'atabay']
const PROVERBIAL_CUES = ['mas', 'kaysa', 'antus', 'better', 'hunger', 'buntas', 'lisud', 'wisdom', 'hard']
const NARRATIVE_CUES = ['once', 'village', 'crocodile', 'monkey', 'river', 'bank', 'day', 'stream', 'forest']
const LYRIC_CUES = ['weep', 'sorrow', 'loneliness', 'tears', 'cry', 'sing', 'mountain', 'mountains', 'mother', 'heart']

/**
 * Extracts interpretable oral literature features from entry transcription and translation.
 */
export function extractOralFeatures(entry: ScorableEntry): OralFeatures {
  const transText = (entry.transcription || '').toLowerCase()
  const translText = (entry.translation || '').toLowerCase()
  const fullText = `${transText} ${translText}`

  const transTokens = tokenizeUnigrams(transText, false)
  const translTokens = tokenizeUnigrams(translText, false)

  const countCues = (tokens: string[], cues: string[]): number => {
    let count = 0
    for (const t of tokens) {
      if (cues.includes(t)) count++
    }
    return count
  }

  const allTokens = [...transTokens, ...translTokens]

  return {
    transcriptionTokens: transTokens.length,
    translationTokens: translTokens.length,
    totalTokens: transTokens.length + translTokens.length,
    tokenRatio: translTokens.length > 0 ? transTokens.length / translTokens.length : transTokens.length,
    hasQuestionMark: fullText.includes('?'),
    questionCueCount: countCues(allTokens, QUESTION_CUES),
    proverbialCueCount: countCues(allTokens, PROVERBIAL_CUES),
    narrativeCueCount: countCues(allTokens, NARRATIVE_CUES),
    lyricCueCount: countCues(allTokens, LYRIC_CUES),
  }
}

export type FeatureKey = keyof OralFeatures

export interface TreeNode {
  isLeaf: boolean
  prediction?: ActiveGenre
  feature?: FeatureKey
  threshold?: number
  left?: TreeNode
  right?: TreeNode
  samples: number
  classCounts: Record<string, number>
  gini: number
}

export interface TreeSample {
  id: string
  title: string
  features: OralFeatures
  genre: ActiveGenre
}

function calculateGini(classCounts: Record<string, number>, total: number): number {
  if (total === 0) return 0
  let sumSq = 0
  for (const count of Object.values(classCounts)) {
    const p = count / total
    sumSq += p * p
  }
  return 1 - sumSq
}

/**
 * Trains a greedy decision tree on oral literature features up to maxDepth.
 */
export function trainDecisionTree(
  samples: TreeSample[],
  maxDepth: number = 3,
  currentDepth: number = 0
): TreeNode {
  const total = samples.length
  const classCounts: Record<string, number> = {}
  for (const g of ACTIVE_GENRES) classCounts[g] = 0
  for (const s of samples) classCounts[s.genre] = (classCounts[s.genre] || 0) + 1

  const gini = calculateGini(classCounts, total)

  // Majority class
  let majorityClass: ActiveGenre = ACTIVE_GENRES[0]
  let maxCount = -1
  for (const [g, count] of Object.entries(classCounts)) {
    if (count > maxCount) {
      maxCount = count
      majorityClass = g as ActiveGenre
    }
  }

  // Base cases: pure node, max depth, or too few samples
  if (gini === 0 || currentDepth >= maxDepth || total <= 2) {
    return {
      isLeaf: true,
      prediction: majorityClass,
      samples: total,
      classCounts,
      gini,
    }
  }

  const candidateFeatures: FeatureKey[] = [
    'transcriptionTokens',
    'totalTokens',
    'questionCueCount',
    'proverbialCueCount',
    'narrativeCueCount',
    'lyricCueCount',
    'tokenRatio',
  ]

  let bestGain = -1
  let bestFeature: FeatureKey | undefined
  let bestThreshold: number | undefined
  let bestLeft: TreeSample[] = []
  let bestRight: TreeSample[] = []

  for (const feature of candidateFeatures) {
    const values = Array.from(new Set(samples.map(s => Number(s.features[feature])))).sort((a, b) => a - b)
    if (values.length <= 1) continue

    // Evaluate split thresholds
    for (let i = 0; i < values.length - 1; i++) {
      const threshold = (values[i] + values[i + 1]) / 2

      const left = samples.filter(s => Number(s.features[feature]) <= threshold)
      const right = samples.filter(s => Number(s.features[feature]) > threshold)

      if (left.length === 0 || right.length === 0) continue

      const leftCounts: Record<string, number> = {}
      for (const s of left) leftCounts[s.genre] = (leftCounts[s.genre] || 0) + 1
      const leftGini = calculateGini(leftCounts, left.length)

      const rightCounts: Record<string, number> = {}
      for (const s of right) rightCounts[s.genre] = (rightCounts[s.genre] || 0) + 1
      const rightGini = calculateGini(rightCounts, right.length)

      const splitGini = (left.length / total) * leftGini + (right.length / total) * rightGini
      const gain = gini - splitGini

      if (gain > bestGain) {
        bestGain = gain
        bestFeature = feature
        bestThreshold = threshold
        bestLeft = left
        bestRight = right
      }
    }
  }

  if (bestGain <= 0.001 || !bestFeature || bestThreshold === undefined) {
    return {
      isLeaf: true,
      prediction: majorityClass,
      samples: total,
      classCounts,
      gini,
    }
  }

  return {
    isLeaf: false,
    feature: bestFeature,
    threshold: bestThreshold,
    samples: total,
    classCounts,
    gini,
    left: trainDecisionTree(bestLeft, maxDepth, currentDepth + 1),
    right: trainDecisionTree(bestRight, maxDepth, currentDepth + 1),
  }
}

/**
 * Predicts genre using the trained decision tree.
 */
export function predictTree(node: TreeNode, features: OralFeatures): ActiveGenre {
  if (node.isLeaf || !node.feature || node.threshold === undefined) {
    return node.prediction || 'RIDDLE'
  }

  const val = Number(features[node.feature])
  if (val <= node.threshold) {
    return node.left ? predictTree(node.left, features) : node.prediction || 'RIDDLE'
  } else {
    return node.right ? predictTree(node.right, features) : node.prediction || 'SONG'
  }
}

