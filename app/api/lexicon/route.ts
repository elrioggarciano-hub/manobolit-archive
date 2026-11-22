import { NextResponse } from 'next/server'
import { getLexicon } from '@/lib/translation/lexiconStore'

export const dynamic = 'force-dynamic'

// GET /api/lexicon — public, read-only lexicon used by the Translator page (phrasebook + offline fallback)
export async function GET() {
  const lexicon = await getLexicon()
  return NextResponse.json(lexicon, { headers: { 'Cache-Control': 'public, max-age=60' } })
}
