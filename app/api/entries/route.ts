import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { classifyEntry } from '@/lib/classification'
import { translateText } from '@/lib/translation'

// GET /api/entries — list all entries with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get('genre')
    const type = searchParams.get('type')
    const keyword = searchParams.get('keyword')
    const theme = searchParams.get('theme')

    const entries = await prisma.literatureEntry.findMany({
      where: {
        ...(genre ? { genre } : {}),
        ...(type ? { type } : {}),
        ...(keyword
          ? {
              OR: [
                { title: { contains: keyword } },
                { content: { contains: keyword } },
                { manoboTitle: { contains: keyword } },
                { englishTitle: { contains: keyword } },
                { narrator: { contains: keyword } },
                { communityLocation: { contains: keyword } },
              ],
            }
          : {}),
        ...(theme
          ? {
              themes: { contains: theme },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parse JSON fields
    const parsed = entries.map(e => ({
      ...e,
      themes: JSON.parse(e.themes || '[]'),
      culturalElements: JSON.parse(e.culturalElements || '[]'),
    }))

    return NextResponse.json({ entries: parsed })
  } catch (error) {
    console.error('GET /api/entries error:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

// POST /api/entries — create a new entry with Agusan Manobo Bible auto-translation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    let manoboTitle = body.manoboTitle || null
    let englishTitle = body.englishTitle || body.title || null
    let transcription = body.transcription || null
    let translation = body.translation || null

    // Auto-translate missing Manobo title from title using Agusan Manobo Bible corpus
    if (!manoboTitle && (body.title || englishTitle)) {
      const res = translateText(body.title || englishTitle, 'en', 'msm')
      manoboTitle = res.translatedText
    }

    // Auto-translate missing transcription (Manobo text) from content (English text)
    if (!transcription && (body.content || translation)) {
      const res = translateText(body.content || translation, 'en', 'msm')
      transcription = res.translatedText
    }

    // Auto-translate missing English translation from transcription
    if (!translation && transcription) {
      const res = translateText(transcription, 'msm', 'en')
      translation = res.translatedText
    }

    const entry = await prisma.literatureEntry.create({
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
        createdBy: body.createdBy || null,
      },
    })

    // Auto-classify and persist classification results for the new entry
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
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/entries error:', error)
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}
