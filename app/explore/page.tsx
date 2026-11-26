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
      // Show the stored model probability as-is; only entries never classified get a live estimate
      const persistedScore = e.classifications[0]?.confidenceScore
      const confidence = persistedScore !== undefined
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
  ['explore-entries-v8'],
  { tags: ['entries'] }
)

// Display names of genre/theme codes, from the taxonomy table (Admin → Dataset & Taxonomies)
const getCategoryLabels = unstable_cache(
  async () => {
    try {
      const defs = await prisma.categoryDefinition.findMany({ select: { code: true, title: true } })
      return Object.fromEntries(defs.map(d => [d.code.toUpperCase(), d.title]))
    } catch {
      return {} as Record<string, string>
    }
  },
  ['explore-category-labels-v1'],
  { tags: ['entries'] }
)

export default async function ExplorePage() {
  const [parsed, categoryLabels] = await Promise.all([getParsedExploreEntries(), getCategoryLabels()])

  return (
    <Suspense fallback={null}>
      <ExploreClient initialEntries={parsed} categoryLabels={categoryLabels} />
    </Suspense>
  )
}
