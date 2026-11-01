import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { computeContentHash } from '@/lib/classification/contentHash'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

// GET /api/ml/dataset - Export strictly human-verified dataset
export async function GET(request: NextRequest) {
  try {
    const entries = await prisma.literatureEntry.findMany({
      where: {
        reviewStatus: 'VERIFIED',
      },
      orderBy: { reviewedAt: 'desc' },
    })

    const verifiedDataset = []
    let excludedCount = 0

    for (const e of entries) {
      const currHash = computeContentHash(e)
      // Strict verification provenance check:
      // If content was edited after verification, exclude from supervised dataset!
      if (!e.verifiedContentHash || e.verifiedContentHash !== currHash) {
        excludedCount++
        continue
      }

      verifiedDataset.push({
        id: e.id,
        title: e.title,
        manoboTitle: e.manoboTitle,
        englishTitle: e.englishTitle,
        transcription: e.transcription,
        translation: e.translation,
        content: e.content,
        verifiedGenre: e.verifiedGenre || e.genre,
        verifiedThemes: JSON.parse(e.verifiedThemes || '[]'),
        source: e.source,
        communityLocation: e.communityLocation,
        reviewerId: e.reviewerId,
        reviewedAt: e.reviewedAt,
        contentHash: currHash,
      })
    }

    return NextResponse.json({
      count: verifiedDataset.length,
      excludedMismatched: excludedCount,
      dataset: verifiedDataset,
    })
  } catch (error) {
    console.error('GET /api/ml/dataset error:', error)
    return NextResponse.json({ error: 'Failed to export verified dataset' }, { status: 500 })
  }
}

// POST /api/ml/dataset - Import dataset records with provenance validation
export async function POST(request: NextRequest) {
  try {
    const isAuthed = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 })
    }

    let importedCount = 0
    for (const item of items) {
      if (!item.title || !item.content) continue

      const contentHash = computeContentHash(item)

      // Treat imported labels as unverified (PENDING) unless trustworthy reviewer provenance is validated
      const hasTrustworthyProvenance = Boolean(
        item.reviewStatus === 'VERIFIED' &&
        item.reviewerId &&
        item.verifiedGenre &&
        item.verifiedContentHash === contentHash
      )

      await prisma.literatureEntry.create({
        data: {
          title: item.title,
          manoboTitle: item.manoboTitle || null,
          englishTitle: item.englishTitle || null,
          type: item.type || 'ORAL_LITERATURE',
          content: item.content,
          transcription: item.transcription || null,
          translation: item.translation || null,
          bisayaTranslation: item.bisayaTranslation || null,
          source: item.source || 'Imported Archive Record',
          communityLocation: item.communityLocation || 'Agusan del Sur',
          province: item.province || 'Agusan del Sur',
          municipality: item.municipality || 'Trento',
          barangay: item.barangay || null,
          genre: item.verifiedGenre || item.genre || 'FOLKTALE',
          themes: JSON.stringify(item.themes || []),
          culturalElements: JSON.stringify(item.culturalElements || []),
          reviewStatus: hasTrustworthyProvenance ? 'VERIFIED' : 'PENDING',
          verifiedGenre: hasTrustworthyProvenance ? item.verifiedGenre : null,
          verifiedThemes: hasTrustworthyProvenance ? JSON.stringify(item.verifiedThemes || []) : null,
          reviewerId: hasTrustworthyProvenance ? item.reviewerId : null,
          reviewedAt: hasTrustworthyProvenance ? new Date(item.reviewedAt) : null,
          contentHash,
          verifiedContentHash: hasTrustworthyProvenance ? contentHash : null,
        },
      })
      importedCount++
    }

    return NextResponse.json({ success: true, importedCount })
  } catch (error) {
    console.error('POST /api/ml/dataset error:', error)
    return NextResponse.json({ error: 'Failed to import records' }, { status: 500 })
  }
}
