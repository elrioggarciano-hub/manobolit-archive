// Ground-Truth Training Corpus for Supervised Machine Learning
// Synthesizes authenticated field records from Catipay & Curato (2024) and Maravilla (2024).

import corpusData from '../../data/training-corpus.json'

export type TrainingDocSource = 'archive-verbatim' | 'author-written'

export interface TrainingDocument {
  id: string
  text: string
  genre: 'MYTH' | 'LEGEND' | 'FOLKTALE' | 'EPIC' | 'RIDDLE' | 'PROVERB' | 'SONG' | 'CHANT'
  themes: string[]
  provenance: string
  source: TrainingDocSource
  citation?: string
  archiveEntryId?: string
  /** True when this doc duplicates an archive field record; excluded from training to avoid evaluation leakage. */
  overlapsArchive?: boolean
}

/**
 * Active genres present in genuine archive field collections (Catipay & Curato 2024, Maravilla 2024).
 * MYTH, LEGEND, EPIC, and CHANT are retained in code for taxonomic completeness, but inactive in prediction.
 */
/**
 * Genres the classifier predicts are DERIVED FROM THE DATA: every genre with at least
 * MIN_EXAMPLES_PER_GENRE human-verified entries (same rule as the Colab notebook). Adding verified entries
 * of a new genre (e.g. MYTH) makes it active automatically — no code change.
 * DEFAULT_ACTIVE_GENRES is only the fallback when no verified data can be read.
 */
export const MIN_EXAMPLES_PER_GENRE = 2
export const DEFAULT_ACTIVE_GENRES: readonly string[] = ['RIDDLE', 'PROVERB', 'FOLKTALE', 'SONG']
/** @deprecated use the genres carried by the trained models (models.genres) or DEFAULT_ACTIVE_GENRES */
export const ACTIVE_GENRES = DEFAULT_ACTIVE_GENRES

/** Genres with enough verified examples, in taxonomy order; falls back to the defaults if fewer than two qualify. */
export function deriveActiveGenres(labels: string[], min: number = MIN_EXAMPLES_PER_GENRE): string[] {
  const counts: Record<string, number> = {}
  for (const l of labels) if (l) counts[l] = (counts[l] || 0) + 1
  const known = (ALL_GENRES as readonly string[]).filter(g => (counts[g] || 0) >= min)
  const extra = Object.keys(counts).filter(g => !(ALL_GENRES as readonly string[]).includes(g) && g !== 'UNCLASSIFIED' && counts[g] >= min)
  const genres = [...known, ...extra]
  return genres.length >= 2 ? genres : [...DEFAULT_ACTIVE_GENRES]
}

export const ALL_GENRES = ['MYTH', 'LEGEND', 'FOLKTALE', 'EPIC', 'RIDDLE', 'PROVERB', 'SONG', 'CHANT'] as const
export type AllGenre = typeof ALL_GENRES[number]

/**
 * Default (fallback) training corpus. The data lives in data/training-corpus.json, not in code.
 * At runtime the authoritative corpus is the TrainingCorpusDocument table (see corpusStore.ts);
 * this file is used to seed that table and as a fallback when the database is unreachable.
 */
export const TRAINING_CORPUS: TrainingDocument[] = corpusData as TrainingDocument[]
