import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { getAlignmentModels } from '@/lib/translation/alignmentStore'
import { getLexicon } from '@/lib/translation/lexiconStore'
import { SUGGESTION_MIN_PROBABILITY } from '@/lib/translation/alignment'

export const dynamic = 'force-dynamic'

// GET /api/ml/lexicon/suggestions — Manobo words the system LEARNED from verified archive texts
// (IBM Model 1 alignment) that are not yet in the lexicon. Admins review and approve them.
export async function GET(request: NextRequest) {
  if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const [models, lexicon] = await Promise.all([getAlignmentModels(), getLexicon()])
  if (!models) return NextResponse.json({ suggestions: [], note: 'No verified parallel texts available to learn from yet.' })

  const known = new Set<string>([
    ...lexicon.words.map(w => w.manobo.toLowerCase()),
    ...lexicon.webonary.map(w => w.manobo.toLowerCase()),
    ...lexicon.webonary.map(w => w.root.toLowerCase()),
    ...Object.keys(lexicon.dialectVariants),
  ])

  const byWord = new Map<string, { manobo: string; english?: string; pEnglish?: number; bisaya?: string; pBisaya?: number; frequency: number }>()
  for (const [dir, lang] of [['msm->en', 'english'], ['msm->ceb', 'bisaya']] as const) {
    for (const [manobo, list] of models.tables[dir]) {
      const best = list[0]
      if (!best || best.probability < SUGGESTION_MIN_PROBABILITY || manobo.length < 3 || known.has(manobo)) continue
      const freq = models.sourceFrequency[dir].get(manobo) || 0
      if (freq === 0) continue // only words actually seen in the literature
      const s = byWord.get(manobo) ?? { manobo, frequency: 0 }
      if (lang === 'english') Object.assign(s, { english: best.target, pEnglish: best.probability })
      else Object.assign(s, { bisaya: best.target, pBisaya: best.probability })
      s.frequency = Math.max(s.frequency, freq)
      byWord.set(manobo, s)
    }
  }

  const suggestions = Array.from(byWord.values())
    .sort((a, b) => Math.max(b.pEnglish ?? 0, b.pBisaya ?? 0) - Math.max(a.pEnglish ?? 0, a.pBisaya ?? 0) || b.frequency - a.frequency)
    .slice(0, 100)

  return NextResponse.json({
    suggestions,
    trainedDocuments: models.trainedDocuments,
    seedPairs: models.seedPairs,
    minProbability: SUGGESTION_MIN_PROBABILITY,
  })
}
