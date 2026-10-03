import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import { classifyEntry } from '@/lib/classification'
import ExploreClient from './ExploreClient'

// The page still renders per request (so a build never depends on a live DB
// connection), but the query result itself is cached in Next's Data Cache and
// reused across visits until an admin create/update/delete calls
// revalidateTag('entries') — instead of hitting Supabase on every click.
export const dynamic = 'force-dynamic'

const getEntriesWithClassifications = unstable_cache(
  async () => prisma.literatureEntry.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      classifications: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      }
    }
  }),
  ['explore-entries-v2'],
  { tags: ['entries'] }
)

export default async function ExplorePage() {
  const entries = await getEntriesWithClassifications()

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
      // unstable_cache serializes its cached value, so a cache-hit returns
      // createdAt/updatedAt as plain strings instead of Date instances — wrap
      // in `new Date(...)` so both the cold-miss (real Date) and cache-hit
      // (already-stringified) cases produce a valid ISO string.
      createdAt: new Date(e.createdAt).toISOString(),
      updatedAt: new Date(e.updatedAt).toISOString(),
      confidence,
    }
  })

  return (
    <Suspense fallback={null}>
      <ExploreClient initialEntries={parsed} />
    </Suspense>
  )
}
