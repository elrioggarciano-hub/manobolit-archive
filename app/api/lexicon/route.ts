import { NextResponse } from 'next/server'
import { getLexicon } from '@/lib/translation/lexiconStore'

export const dynamic = 'force-dynamic'

// GET /api/lexicon — public, read-only lexicon used by the Translator page (phrasebook + offline fallback)
export async function GET() {
  // The Bible attestation index stays on the server (it is large and used only for validation)
  const { attested, ...lexicon } = await getLexicon()
  void attested
  return NextResponse.json(lexicon, { headers: { 'Cache-Control': 'public, max-age=60' } })
}
