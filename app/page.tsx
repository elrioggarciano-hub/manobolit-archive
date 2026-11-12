import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import ArchiveClient from '@/app/ArchiveClient'

// Cache page at edge with ISR (stale-while-revalidate 60s) for instant response times
export const revalidate = 60

const getCachedHomeEntries = unstable_cache(
  async () => {
    const entries = await prisma.literatureEntry.findMany({ orderBy: { createdAt: 'desc' } })
    return entries.map(e => ({
      ...e,
      themes: JSON.parse(e.themes || '[]') as string[],
      culturalElements: JSON.parse(e.culturalElements || '[]') as string[],
      createdAt: new Date(e.createdAt).toISOString(),
      updatedAt: new Date(e.updatedAt).toISOString(),
    }))
  },
  ['home-entries-v5'],
  { tags: ['entries'] }
)

export default async function Home() {
  const parsed = await getCachedHomeEntries()
  return <ArchiveClient entries={parsed} />
}
