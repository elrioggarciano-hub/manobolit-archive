import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import ArchiveClient from '@/app/ArchiveClient'

// The page still renders per request (so a build never depends on a live DB
// connection), but the query result itself is cached in Next's Data Cache and
// reused across visits until an admin create/update/delete calls
// revalidateTag('entries') — instead of hitting Supabase on every click.
export const dynamic = 'force-dynamic'

const getEntries = unstable_cache(
  async () => prisma.literatureEntry.findMany({ orderBy: { createdAt: 'desc' } }),
  ['home-entries-v2'],
  { tags: ['entries'] }
)

export default async function Home() {
  const entries = await getEntries()

  const parsed = entries.map(e => ({
    ...e,
    themes: JSON.parse(e.themes || '[]') as string[],
    culturalElements: JSON.parse(e.culturalElements || '[]') as string[],
    // unstable_cache serializes its cached value, so a cache-hit returns
    // createdAt/updatedAt as plain strings instead of Date instances — wrap
    // in `new Date(...)` so both the cold-miss (real Date) and cache-hit
    // (already-stringified) cases produce a valid ISO string.
    createdAt: new Date(e.createdAt).toISOString(),
    updatedAt: new Date(e.updatedAt).toISOString(),
  }))

  return <ArchiveClient entries={parsed} />
}
