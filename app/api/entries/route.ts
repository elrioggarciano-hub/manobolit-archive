import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import { classifyEntry } from '@/lib/classification'
import { predictWithML } from '@/lib/classification/mlClient'
import { computeContentHash } from '@/lib/classification/contentHash'
import { translateText } from '@/lib/translation'

// Home/Explore/Classification/Dashboard cache their entry queries under the
// 'entries' tag, so every mutation must invalidate that tag; the entry detail
// page is revalidated by its own specific path.
function revalidateEntryPages(entryId?: string) {
  revalidateTag('entries')
  if (entryId) revalidatePath(`/archive/${entryId}`)
}

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

// POST /api/entries — create a new entry with ManoboLit Lexicon auto-translation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    let manoboTitle = body.manoboTitle || null
    let englishTitle = body.englishTitle || body.title || null
    let transcription = body.transcription || null
    let translation = body.translation || null

    // Auto-translate missing Manobo title from title using ManoboLit Reference Lexicon
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

    let bisayaTranslation = body.bisayaTranslation || null

    // Auto-translate missing Bisaya (Cebuano) translation from transcription or content
    if (!bisayaTranslation && transcription) {
      const res = translateText(transcription, 'msm', 'ceb')
      bisayaTranslation = res.translatedText
    } else if (!bisayaTranslation && (body.content || translation)) {
      const res = translateText(body.content || translation, 'en', 'ceb')
      bisayaTranslation = res.translatedText
    }

    const contentHash = computeContentHash({
      title: body.title,
      transcription,
      translation,
      content: body.content,
    })

    const entry = await prisma.literatureEntry.create({
      data: {
        title: body.title,
        manoboTitle,
        englishTitle,
        type: body.type,
        content: body.content,
        transcription,
        translation,
        bisayaTranslation: bisayaTranslation || null,
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
        reviewStatus: 'PENDING',
        contentHash,
      },
    })

    // Classify using real ML pipeline with rule-based fallback
    const mlResult = await predictWithML(entry)
    const ruleFallback = classifyEntry(entry)

    await prisma.classification.create({
      data: {
        entryId: entry.id,
        classifiedGenre: mlResult.predictedGenre,
        classifiedThemes: JSON.stringify(ruleFallback.themes.map(t => t.value)),
        confidenceScore: mlResult.confidence,
        rulesApplied: JSON.stringify(ruleFallback.rulesApplied),
        predictionSource: mlResult.predictionSource,
        modelVersion: mlResult.modelVersion,
        probabilities: JSON.stringify(mlResult.probabilities),
      },
    })

    revalidateEntryPages(entry.id)

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
