import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import { computeContentHash } from '@/lib/classification/contentHash'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

// GET /api/review - Fetch records with review filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'ALL' | 'PENDING' | 'VERIFIED' | 'UNCERTAIN'

    const whereClause: any = {}
    if (status && status !== 'ALL') {
      whereClause.reviewStatus = status
    }

    const entries = await prisma.literatureEntry.findMany({
      where: whereClause,
      include: {
        classifications: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const parsed = entries.map(e => {
      const latestClassification = e.classifications[0]
      const currHash = computeContentHash(e)
      const isHashMismatched = Boolean(e.verifiedContentHash && e.verifiedContentHash !== currHash)

      return {
        id: e.id,
        title: e.title,
        manoboTitle: e.manoboTitle,
        englishTitle: e.englishTitle,
        type: e.type,
        content: e.content,
        transcription: e.transcription,
        translation: e.translation,
        bisayaTranslation: e.bisayaTranslation,
        source: e.source,
        communityLocation: e.communityLocation,
        municipality: e.municipality,
        province: e.province,
        genre: e.genre,
        themes: JSON.parse(e.themes || '[]'),
        // Human verification details
        reviewStatus: isHashMismatched ? 'PENDING' : e.reviewStatus,
        isHashMismatched,
        verifiedGenre: e.verifiedGenre,
        verifiedThemes: JSON.parse(e.verifiedThemes || '[]'),
        reviewerId: e.reviewerId,
        reviewedAt: e.reviewedAt,
        reviewNotes: e.reviewNotes,
        contentHash: currHash,
        verifiedContentHash: e.verifiedContentHash,
        // Prediction suggestions
        suggestedGenre: latestClassification?.classifiedGenre || e.genre,
        suggestedThemes: JSON.parse(latestClassification?.classifiedThemes || '[]'),
        predictionSource: latestClassification?.predictionSource || 'RULE_BASED',
        modelVersion: latestClassification?.modelVersion || 'rules-baseline',
        confidenceScore: latestClassification?.confidenceScore || 0.85,
        probabilities: JSON.parse(latestClassification?.probabilities || '{}'),
        reviewHistory: e.reviews,
      }
    })

    return NextResponse.json({ entries: parsed })
  } catch (error) {
    console.error('GET /api/review error:', error)
    return NextResponse.json({ error: 'Failed to fetch review queue' }, { status: 500 })
  }
}

// POST /api/review - Submit a human verification decision
export async function POST(request: NextRequest) {
  try {
    // 1. Enforce authentication on the backend
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const isAuthed = await verifySessionToken(sessionCookie)
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized: Review requires an authenticated session' }, { status: 401 })
    }

    const body = await request.json()
    const { entryId, decision, approvedGenre, approvedThemes, notes } = body

    if (!entryId || !decision) {
      return NextResponse.json({ error: 'entryId and decision are required' }, { status: 400 })
    }

    if (!['CONFIRMED', 'CORRECTED', 'UNCERTAIN'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision type' }, { status: 400 })
    }

    const entry = await prisma.literatureEntry.findUnique({
      where: { id: entryId },
      include: { classifications: { orderBy: { timestamp: 'desc' }, take: 1 } },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const latestClassification = entry.classifications[0]
    const contentHash = computeContentHash(entry)

    let finalGenre: string | null = null
    let finalThemes: string[] = []
    let newStatus: string

    if (decision === 'CONFIRMED') {
      newStatus = 'VERIFIED'
      finalGenre = latestClassification?.classifiedGenre || entry.genre
      finalThemes = latestClassification ? JSON.parse(latestClassification.classifiedThemes || '[]') : JSON.parse(entry.themes || '[]')
    } else if (decision === 'CORRECTED') {
      if (!approvedGenre) {
        return NextResponse.json({ error: 'approvedGenre is required when correcting classification' }, { status: 400 })
      }
      newStatus = 'VERIFIED'
      finalGenre = approvedGenre
      finalThemes = approvedThemes || JSON.parse(entry.themes || '[]')
    } else {
      newStatus = 'UNCERTAIN'
      finalGenre = null
      finalThemes = []
    }

    // 2. Create immutable audit record in ClassificationReview
    const auditRecord = await prisma.classificationReview.create({
      data: {
        entryId: entry.id,
        suggestedGenre: latestClassification?.classifiedGenre || entry.genre,
        suggestedThemes: latestClassification?.classifiedThemes || entry.themes,
        predictionSource: latestClassification?.predictionSource || 'RULE_BASED',
        modelVersion: latestClassification?.modelVersion || 'rules-baseline',
        decision,
        approvedGenre: finalGenre,
        approvedThemes: finalThemes ? JSON.stringify(finalThemes) : null,
        reviewerId: 'admin',
        notes: notes || null,
        contentHash,
      },
    })

    // 3. Update entry with verification provenance
    const updatedEntry = await prisma.literatureEntry.update({
      where: { id: entryId },
      data: {
        reviewStatus: newStatus,
        verifiedGenre: finalGenre,
        verifiedThemes: finalThemes ? JSON.stringify(finalThemes) : null,
        genre: finalGenre || entry.genre, // Keep display genre aligned with approved
        reviewerId: 'admin',
        reviewedAt: new Date(),
        reviewNotes: notes || null,
        contentHash,
        verifiedContentHash: newStatus === 'VERIFIED' ? contentHash : null,
      },
    })

    revalidateTag('entries')
    revalidatePath('/admin')
    revalidatePath(`/archive/${entryId}`)

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      review: auditRecord,
    })
  } catch (error) {
    console.error('POST /api/review error:', error)
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 })
  }
}
