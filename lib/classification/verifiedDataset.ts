// The supervised dataset: human-verified entries whose content has not changed since verification.
// Shared by the Colab export (GET /api/ml/dataset) and the in-app automatic retraining (autoTrainer.ts),
// so both always train on exactly the same records.

import { prisma } from '../database/prisma'
import { computeContentHash } from './contentHash'
import { ensureActiveModels } from './retrain'
import { classifyHybrid } from './hybrid'
import { extractEntryText } from './evaluation'

export interface VerifiedRecord {
  id: string
  title: string
  manoboTitle: string | null
  englishTitle: string | null
  transcription: string | null
  translation: string | null
  bisayaTranslation: string | null
  content: string
  ruleScores: Record<string, number>
  verifiedGenre: string
  verifiedThemes: string[]
  source: string
  communityLocation: string
  reviewerId: string | null
  reviewedAt: Date | null
  contentHash: string
}

export async function loadVerifiedDataset(): Promise<{ dataset: VerifiedRecord[]; excludedMismatched: number }> {
  const entries = await prisma.literatureEntry.findMany({
    where: { reviewStatus: 'VERIFIED' },
    orderBy: { reviewedAt: 'desc' },
  })

  // Rule-based scores from the current rule base, so rule-based + ML can be evaluated together
  const { rules } = await ensureActiveModels()
  const dataset: VerifiedRecord[] = []
  let excludedMismatched = 0

  for (const e of entries) {
    const currHash = computeContentHash(e)
    // Strict verification provenance: content edited after verification is excluded from training
    if (!e.verifiedContentHash || e.verifiedContentHash !== currHash) {
      excludedMismatched++
      continue
    }

    dataset.push({
      id: e.id,
      title: e.title,
      manoboTitle: e.manoboTitle,
      englishTitle: e.englishTitle,
      transcription: e.transcription,
      translation: e.translation,
      bisayaTranslation: e.bisayaTranslation,
      content: e.content,
      ruleScores: Object.fromEntries(
        classifyHybrid(extractEntryText(e as any, 'both', true), 'ALL', 'RULE_BASED', { rules, rulesProfile: 'framework-only' })
          .genre.allScores.map(s => [s.genre, s.confidence])
      ),
      verifiedGenre: e.verifiedGenre || e.genre,
      verifiedThemes: JSON.parse(e.verifiedThemes || '[]'),
      source: e.source,
      communityLocation: e.communityLocation,
      reviewerId: e.reviewerId,
      reviewedAt: e.reviewedAt,
      contentHash: currHash,
    })
  }

  return { dataset, excludedMismatched }
}
