import { classifyEntry } from './engine'

export interface AccuracyMetrics {
  accuracy: number
  precision: number
  recall: number
  f1: number
  sampleSize: number
}

interface ScorableEntry {
  content: string
  transcription?: string | null
  genre: string
}

/**
 * Evaluates the rule-based classifier against the archive's own curated
 * genre labels: for each entry, the classifier is re-run on its content and
 * transcription exactly as it is at entry creation/update time, and the
 * top-scoring predicted genre is compared against the genre already stored
 * for that entry (the ground truth). Precision, recall, and F1 are
 * macro-averaged across every genre class present in the corpus — the
 * standard approach for multiclass evaluation, and one that needs no
 * separate held-out test set since it validates against the archive's own
 * accepted labels.
 */
export function computeAccuracyMetrics(entries: ScorableEntry[]): AccuracyMetrics {
  if (entries.length === 0) {
    return { accuracy: 0, precision: 0, recall: 0, f1: 0, sampleSize: 0 }
  }

  const classes = Array.from(new Set(entries.map(e => e.genre)))
  const stats: Record<string, { tp: number; fp: number; fn: number }> = {}
  for (const c of classes) stats[c] = { tp: 0, fp: 0, fn: 0 }

  let correct = 0

  for (const entry of entries) {
    const result = classifyEntry(entry.content, entry.transcription || '')
    const predicted = result.genre.value
    const actual = entry.genre

    if (predicted === actual) {
      correct++
      if (stats[predicted]) stats[predicted].tp++
    } else {
      if (stats[predicted]) stats[predicted].fp++
      if (stats[actual]) stats[actual].fn++
    }
  }

  const perClass = classes.map(c => {
    const { tp, fp, fn } = stats[c]
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
    return { precision, recall, f1 }
  })

  const avg = (nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length

  return {
    accuracy: Math.round((correct / entries.length) * 1000) / 1000,
    precision: Math.round(avg(perClass.map(p => p.precision)) * 1000) / 1000,
    recall: Math.round(avg(perClass.map(p => p.recall)) * 1000) / 1000,
    f1: Math.round(avg(perClass.map(p => p.f1)) * 1000) / 1000,
    sampleSize: entries.length,
  }
}
