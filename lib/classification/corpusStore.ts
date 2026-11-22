// Training Corpus Store
// The authoritative training corpus lives in the TrainingCorpusDocument database table,
// managed by admins (Admin → Training Corpus). data/training-corpus.json is only the
// seed source and the fallback when the database is unreachable or not yet seeded.

import { prisma } from '../database/prisma'
import { TRAINING_CORPUS, TrainingDocument, ALL_GENRES } from './trainingCorpus'

export type CorpusOrigin = 'database' | 'fallback-json'

export interface LoadedCorpus {
  docs: TrainingDocument[]
  origin: CorpusOrigin
  /** Changes whenever the database corpus changes (used to decide when to retrain). */
  fingerprint: string
}

export const TRAINING_SOURCES = ['archive-verbatim', 'author-written'] as const

export function rowToTrainingDocument(row: any): TrainingDocument {
  let themes: string[] = []
  try {
    themes = JSON.parse(row.themes || '[]')
  } catch {
    themes = []
  }
  return {
    id: row.id,
    text: row.text,
    genre: row.genre,
    themes,
    provenance: row.provenance,
    source: row.source,
    citation: row.citation ?? undefined,
    archiveEntryId: row.archiveEntryId ?? undefined,
    overlapsArchive: Boolean(row.overlapsArchive),
  }
}

/**
 * Loads active training documents from the database, falling back to the bundled JSON
 * when the table is empty (not seeded yet) or the database cannot be reached.
 */
export async function loadTrainingCorpus(): Promise<LoadedCorpus> {
  try {
    const [rows, agg] = await Promise.all([
      prisma.trainingCorpusDocument.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } }),
      prisma.trainingCorpusDocument.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
    ])
    if (rows.length > 0) {
      return {
        docs: rows.map(rowToTrainingDocument),
        origin: 'database',
        fingerprint: `db:${agg._count._all}:${agg._max.updatedAt?.getTime() ?? 0}`,
      }
    }
  } catch (err: any) {
    console.warn('[Corpus] Database corpus unavailable; using data/training-corpus.json:', err.message)
  }
  return { docs: TRAINING_CORPUS, origin: 'fallback-json', fingerprint: `json:${TRAINING_CORPUS.length}` }
}

/** Validates admin input for a training document. Returns an error message or null. */
export function validateTrainingDocInput(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body'
  if (!body.text || typeof body.text !== 'string' || body.text.trim().length < 3) return 'Text is required'
  if (!(ALL_GENRES as readonly string[]).includes(body.genre)) return `Genre must be one of: ${ALL_GENRES.join(', ')}`
  if (!(TRAINING_SOURCES as readonly string[]).includes(body.source)) return `Source must be one of: ${TRAINING_SOURCES.join(', ')}`
  if (!body.provenance || typeof body.provenance !== 'string') return 'Provenance is required'
  if (body.themes !== undefined && !Array.isArray(body.themes)) return 'Themes must be an array'
  return null
}
