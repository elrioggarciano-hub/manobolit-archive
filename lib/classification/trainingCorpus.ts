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
export const ACTIVE_GENRES = ['RIDDLE', 'PROVERB', 'FOLKTALE', 'SONG'] as const
export type ActiveGenre = typeof ACTIVE_GENRES[number]

export const ALL_GENRES = ['MYTH', 'LEGEND', 'FOLKTALE', 'EPIC', 'RIDDLE', 'PROVERB', 'SONG', 'CHANT'] as const
export type AllGenre = typeof ALL_GENRES[number]

/**
 * Default (fallback) training corpus. The data lives in data/training-corpus.json, not in code.
 * At runtime the authoritative corpus is the TrainingCorpusDocument table (see corpusStore.ts);
 * this file is used to seed that table and as a fallback when the database is unreachable.
 */
export const TRAINING_CORPUS: TrainingDocument[] = corpusData as TrainingDocument[]
