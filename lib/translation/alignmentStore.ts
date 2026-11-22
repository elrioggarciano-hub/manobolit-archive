// Server-side cache of the learned alignment models. Retrains automatically when the set of
// verified entries or the lexicon changes (checked at most every CHECK_INTERVAL_MS).
import { prisma } from '../database/prisma'
import { AlignmentModels, buildAlignmentModels } from './alignment'
import { getLexicon } from './lexiconStore'
import { Lexicon } from './lexicon'

const CHECK_INTERVAL_MS = 60_000
let cached: { key: string; models: AlignmentModels; lexicon: Lexicon } | null = null
let lastCheck = 0
let inflight: Promise<AlignmentModels | null> | null = null

export async function getAlignmentModels(): Promise<AlignmentModels | null> {
  if (cached && Date.now() - lastCheck < CHECK_INTERVAL_MS) return cached.models
  if (inflight) return inflight

  inflight = (async () => {
    try {
      lastCheck = Date.now()
      const lexicon = await getLexicon()
      const agg = await prisma.literatureEntry.aggregate({
        where: { reviewStatus: 'VERIFIED' },
        _count: { _all: true },
        _max: { updatedAt: true },
      })
      const key = `${agg._count._all}:${agg._max.updatedAt?.getTime() ?? 0}`
      if (cached && cached.key === key && cached.lexicon === lexicon) return cached.models

      const records = await prisma.literatureEntry.findMany({
        where: { reviewStatus: 'VERIFIED' },
        select: { transcription: true, translation: true, bisayaTranslation: true },
      })
      const models = buildAlignmentModels(records, [...lexicon.words, ...lexicon.webonary])
      cached = { key, models, lexicon }
      console.log(`[Alignment] Trained IBM Model 1 on ${models.trainedDocuments} parallel texts + ${models.seedPairs} lexicon seeds.`)
      return models
    } catch (err: any) {
      console.warn('[Alignment] Could not train learned translations:', err.message)
      return cached?.models ?? null
    } finally {
      inflight = null
    }
  })()
  return inflight
}
