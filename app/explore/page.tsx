import { prisma } from '@/lib/database/prisma'
import { classifyEntry } from '@/lib/classification'
import ExploreClient from './ExploreClient'

export const revalidate = 0 // Disable cache to get fresh entries

export default async function ExplorePage() {
  const entries = await prisma.literatureEntry.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      classifications: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      }
    }
  })

  const parsed = entries.map(e => {
    // Older/seeded entries never had the rule engine run on insert, so there's
    // no persisted Classification row — compute it live instead of faking a number.
    const confidence = e.classifications[0]?.confidenceScore !== undefined
      ? Math.round(e.classifications[0].confidenceScore * 100)
      : Math.round(classifyEntry(e.content, e.transcription || '').overallConfidence * 100)

    return {
      ...e,
      themes: JSON.parse(e.themes || '[]') as string[],
      culturalElements: JSON.parse(e.culturalElements || '[]') as string[],
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      confidence,
    }
  })

  return <ExploreClient initialEntries={parsed} />
}
