import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { computeContentHash } from '@/lib/classification/contentHash'

const OFFICIAL_GENRES = [
  'MYTH', 'LEGEND', 'FOLKTALE', 'EPIC',
  'RIDDLE', 'PROVERB', 'SONG', 'CHANT'
]

export async function GET() {
  try {
    const entries = await prisma.literatureEntry.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        transcription: true,
        translation: true,
        genre: true,
        reviewStatus: true,
        verifiedGenre: true,
        contentHash: true,
        verifiedContentHash: true,
      },
    })

    const verifiedCounts: Record<string, number> = {}
    for (const g of OFFICIAL_GENRES) verifiedCounts[g] = 0

    let totalVerified = 0
    let totalPending = 0
    let totalUncertain = 0
    let totalMismatched = 0

    for (const e of entries) {
      const currHash = computeContentHash(e)
      const isMismatched = Boolean(e.verifiedContentHash && e.verifiedContentHash !== currHash)

      if (isMismatched) {
        totalMismatched++
        totalPending++
        continue
      }

      if (e.reviewStatus === 'VERIFIED') {
        const g = e.verifiedGenre || e.genre
        if (g in verifiedCounts) {
          verifiedCounts[g]++
        } else {
          verifiedCounts[g] = 1
        }
        totalVerified++
      } else if (e.reviewStatus === 'UNCERTAIN') {
        totalUncertain++
      } else {
        totalPending++
      }
    }

    const missingGenres = OFFICIAL_GENRES.filter(g => (verifiedCounts[g] || 0) === 0)
    const underrepresentedGenres = OFFICIAL_GENRES.filter(g => {
      const c = verifiedCounts[g] || 0
      return c > 0 && c < 3
    })

    const classesWithMinSamples = Object.values(verifiedCounts).filter(c => c >= 2).length
    const isSufficientForTraining = classesWithMinSamples >= 2 && totalVerified >= 4

    return NextResponse.json({
      totalRecords: entries.length,
      totalVerified,
      totalPending,
      totalUncertain,
      totalMismatched,
      verifiedCounts,
      missingGenres,
      underrepresentedGenres,
      isSufficientForTraining,
      message: isSufficientForTraining
        ? 'Verified dataset meets minimum requirements for supervised model training.'
        : `Insufficient verified data: requires at least 2 categories with >= 2 verified examples each (currently ${classesWithMinSamples} meet this).`,
    })
  } catch (error) {
    console.error('GET /api/ml/dataset/summary error:', error)
    return NextResponse.json({ error: 'Failed to compute dataset summary' }, { status: 500 })
  }
}
