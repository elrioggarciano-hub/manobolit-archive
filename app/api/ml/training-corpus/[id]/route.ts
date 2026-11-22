import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { validateTrainingDocInput } from '@/lib/classification/corpusStore'
import { ensureActiveModels } from '@/lib/classification/retrain'

async function isAdmin(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

// PUT /api/ml/training-corpus/:id — edit a document (or toggle isActive)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const existing = await prisma.trainingCorpusDocument.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Training document not found' }, { status: 404 })

    const body = await request.json()
    const merged = {
      text: body.text ?? existing.text,
      genre: body.genre ?? existing.genre,
      source: body.source ?? existing.source,
      provenance: body.provenance ?? existing.provenance,
      themes: body.themes ?? JSON.parse(existing.themes || '[]'),
    }
    const invalid = validateTrainingDocInput(merged)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const doc = await prisma.trainingCorpusDocument.update({
      where: { id: params.id },
      data: {
        text: merged.text.trim(),
        genre: merged.genre,
        source: merged.source,
        provenance: merged.provenance.trim(),
        themes: JSON.stringify(merged.themes),
        citation: body.citation !== undefined ? body.citation?.trim() || null : existing.citation,
        archiveEntryId: body.archiveEntryId !== undefined ? body.archiveEntryId?.trim() || null : existing.archiveEntryId,
        overlapsArchive: body.overlapsArchive !== undefined ? Boolean(body.overlapsArchive) : existing.overlapsArchive,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    })
    await ensureActiveModels(true)
    return NextResponse.json({ doc: { ...doc, themes: JSON.parse(doc.themes) } })
  } catch (error) {
    console.error('PUT /api/ml/training-corpus/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update training document' }, { status: 500 })
  }
}

// DELETE /api/ml/training-corpus/:id — permanently remove a document
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.trainingCorpusDocument.delete({ where: { id: params.id } })
    await ensureActiveModels(true)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/ml/training-corpus/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete training document' }, { status: 500 })
  }
}
