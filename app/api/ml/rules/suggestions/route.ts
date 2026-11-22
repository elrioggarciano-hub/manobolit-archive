import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { ensureActiveModels } from '@/lib/classification/retrain'
import { discoverRuleTerms, MIN_CONFIDENCE, MIN_SUPPORT } from '@/lib/classification/ruleDiscovery'
import { extractEntryText } from '@/lib/classification/evaluation'

export const dynamic = 'force-dynamic'

// GET /api/ml/rules/suggestions — rule terms DISCOVERED from human-verified entries (association rules), for review
export async function GET(request: NextRequest) {
  if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const [models, verified] = await Promise.all([
      ensureActiveModels(),
      prisma.literatureEntry.findMany({ where: { reviewStatus: 'VERIFIED' } }),
    ])
    const entries = verified.map(e => {
      const rawThemes = e.verifiedThemes ?? e.themes
      let themes: string[] = []
      try {
        themes = JSON.parse(rawThemes || '[]')
      } catch {
        themes = []
      }
      return { text: extractEntryText(e as any, 'both', true), genre: e.verifiedGenre || e.genre, themes }
    })
    return NextResponse.json({
      suggestions: discoverRuleTerms(entries, models.rules),
      verifiedEntries: entries.length,
      minSupport: MIN_SUPPORT,
      minConfidence: MIN_CONFIDENCE,
    })
  } catch (error) {
    console.error('GET /api/ml/rules/suggestions error:', error)
    return NextResponse.json({ error: 'Failed to discover rule terms' }, { status: 500 })
  }
}
