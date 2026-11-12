import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import { classifyEntry } from '@/lib/classification'
import ExploreClient from './ExploreClient'

// Edge ISR with 60s stale-while-revalidate for sub-50ms page delivery
export const revalidate = 60

const getParsedExploreEntries = unstable_cache(
  async () => {
    const entries = await prisma.literatureEntry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        classifications: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        }
      }
    })

    return entries.map(e => {
      const persistedScore = e.classifications[0]?.confidenceScore
      const confidence = (persistedScore !== undefined && persistedScore >= 0.50)
        ? Math.round(persistedScore * 100)
        : Math.round(classifyEntry(e).overallConfidence * 100)

      return {
        ...e,
        themes: JSON.parse(e.themes || '[]') as string[],
        culturalElements: JSON.parse(e.culturalElements || '[]') as string[],
        createdAt: new Date(e.createdAt).toISOString(),
        updatedAt: new Date(e.updatedAt).toISOString(),
        confidence,
      }
    })
  },
  ['explore-entries-v6'],
  { tags: ['entries'] }
)

export default async function ExplorePage() {
  const parsed = await getParsedExploreEntries()

  return (
    <Suspense fallback={null}>
      <ExploreClient initialEntries={parsed} />
    </Suspense>
  )
}
