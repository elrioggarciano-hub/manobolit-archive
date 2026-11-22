import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { validateTrainingDocInput } from '@/lib/classification/corpusStore'
import { ensureActiveModels } from '@/lib/classification/retrain'

async function isAdmin(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

// GET /api/ml/training-corpus — all training documents (active and disabled)
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const docs = await prisma.trainingCorpusDocument.findMany({ orderBy: [{ genre: 'asc' }, { id: 'asc' }] })
    return NextResponse.json({
      docs: docs.map(d => ({ ...d, themes: JSON.parse(d.themes || '[]') })),
    })
  } catch (error: any) {
    console.error('GET /api/ml/training-corpus error:', error)
    return NextResponse.json(
      { error: 'Could not load training corpus. Has the migration been applied and the table seeded (npm run seed:corpus)?' },
      { status: 500 }
    )
  }
}

// POST /api/ml/training-corpus — add a training document
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const invalid = validateTrainingDocInput(body)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const id = `tr-${String(body.genre).toLowerCase()}-${Date.now().toString(36)}`
    const doc = await prisma.trainingCorpusDocument.create({
      data: {
        id,
        text: body.text.trim(),
        genre: body.genre,
        themes: JSON.stringify(body.themes || []),
        provenance: body.provenance.trim(),
        source: body.source,
        citation: body.citation?.trim() || null,
        archiveEntryId: body.archiveEntryId?.trim() || null,
        overlapsArchive: Boolean(body.overlapsArchive),
        isActive: body.isActive !== false,
      },
    })
    await ensureActiveModels(true)
    return NextResponse.json({ doc: { ...doc, themes: JSON.parse(doc.themes) } }, { status: 201 })
  } catch (error) {
    console.error('POST /api/ml/training-corpus error:', error)
    return NextResponse.json({ error: 'Failed to add training document' }, { status: 500 })
  }
}
