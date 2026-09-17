import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { classifyEntry } from '@/lib/classification'
import { translateText } from '@/lib/translation'

// GET /api/entries/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await prisma.literatureEntry.findUnique({
      where: { id: params.id },
      include: { classifications: { orderBy: { timestamp: 'desc' }, take: 1 } },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({
      entry: {
        ...entry,
        themes: JSON.parse(entry.themes || '[]'),
        culturalElements: JSON.parse(entry.culturalElements || '[]'),
        classifications: entry.classifications.map(c => ({
          ...c,
          classifiedThemes: JSON.parse(c.classifiedThemes || '[]'),
          rulesApplied: JSON.parse(c.rulesApplied || '[]'),
        })),
      },
    })
  } catch (error) {
    console.error('GET /api/entries/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 })
  }
}

// PUT /api/entries/[id] — update entry with Agusan Manobo Bible auto-translation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    let manoboTitle = body.manoboTitle || null
    let englishTitle = body.englishTitle || body.title || null
    let transcription = body.transcription || null
    let translation = body.translation || null

    if (!manoboTitle && (body.title || englishTitle)) {
      const res = translateText(body.title || englishTitle, 'en', 'msm')
      manoboTitle = res.translatedText
    }

    if (!transcription && (body.content || translation)) {
      const res = translateText(body.content || translation, 'en', 'msm')
      transcription = res.translatedText
    }

    if (!translation && transcription) {
      const res = translateText(transcription, 'msm', 'en')
      translation = res.translatedText
    }

    const entry = await prisma.literatureEntry.update({
      where: { id: params.id },
      data: {
        title: body.title,
        manoboTitle,
        englishTitle,
        type: body.type,
        content: body.content,
        transcription,
        translation,
        audioFile: body.audioFile || null,
        audioDuration: body.audioDuration ? Number(body.audioDuration) : null,
        source: body.source,
        yearCollected: body.yearCollected ? Number(body.yearCollected) : null,
        narrator: body.narrator || null,
        communityLocation: body.communityLocation,
        province: body.province,
        municipality: body.municipality,
        barangay: body.barangay || null,
        genre: body.genre,
        themes: JSON.stringify(body.themes || []),
        culturalElements: JSON.stringify(body.culturalElements || []),
      },
    })

    // Delete old classifications and create a new one matching the updated content
    await prisma.classification.deleteMany({ where: { entryId: params.id } })
    const result = classifyEntry(entry.content, entry.transcription || '')
    await prisma.classification.create({
      data: {
        entryId: entry.id,
        classifiedGenre: result.genre.value,
        classifiedThemes: JSON.stringify(result.themes.map(t => t.value)),
        confidenceScore: result.overallConfidence,
        rulesApplied: JSON.stringify(result.rulesApplied),
      },
    })

    return NextResponse.json({
      entry: {
        ...entry,
        themes: JSON.parse(entry.themes),
        culturalElements: JSON.parse(entry.culturalElements),
      },
    })
  } catch (error) {
    console.error('PUT /api/entries/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
  }
}

// DELETE /api/entries/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.literatureEntry.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/entries/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
