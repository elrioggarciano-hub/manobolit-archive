import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { validateLexiconRowInput, lexiconDataFromBody } from '@/lib/translation/lexicon'
import { invalidateLexiconCache } from '@/lib/translation/lexiconStore'

async function isAdmin(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

// GET /api/ml/lexicon — all lexicon rows including disabled ones (admin)
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const rows = await prisma.lexiconEntry.findMany({ orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }] })
    return NextResponse.json({ rows })
  } catch (error) {
    console.error('GET /api/ml/lexicon error:', error)
    return NextResponse.json(
      { error: 'Could not load the lexicon. Has the migration been applied and the table seeded (npm run seed:lexicon)?' },
      { status: 500 }
    )
  }
}

// POST /api/ml/lexicon — add a word, phrase, dictionary entry, dialect variant or affix (admin)
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const invalid = validateLexiconRowInput(body)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const last = await prisma.lexiconEntry.aggregate({ _max: { sortOrder: true } })
    const row = await prisma.lexiconEntry.create({
      data: { ...lexiconDataFromBody(body), sortOrder: (last._max.sortOrder ?? 0) + 1 },
    })
    invalidateLexiconCache()
    return NextResponse.json({ row }, { status: 201 })
  } catch (error) {
    console.error('POST /api/ml/lexicon error:', error)
    return NextResponse.json({ error: 'Failed to add lexicon entry' }, { status: 500 })
  }
}
