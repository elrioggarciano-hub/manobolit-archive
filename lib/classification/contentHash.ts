import crypto from 'crypto'

export interface HashableEntry {
  title?: string | null
  transcription?: string | null
  translation?: string | null
  content?: string | null
}

/**
 * Computes a deterministic SHA-256 hash of the classification-relevant text fields.
 * If any of these fields change after human verification, the hash changes,
 * triggering automatic invalidation and requiring re-review.
 */
export function computeContentHash(entry: HashableEntry): string {
  const normalized = [
    (entry.title || '').trim().toLowerCase(),
    (entry.transcription || '').trim().toLowerCase(),
    (entry.translation || '').trim().toLowerCase(),
    (entry.content || '').trim().toLowerCase(),
  ].join('\n---\n')

  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex')
}
