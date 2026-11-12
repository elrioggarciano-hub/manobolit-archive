import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import EntryDetail from '@/components/EntryDetail'
import BackButton from '@/components/BackButton'

// Edge ISR with 60s stale-while-revalidate for sub-50ms entry retrieval
export const revalidate = 60

const getCachedEntry = unstable_cache(
  async (id: string) => {
    const entry = await prisma.literatureEntry.findUnique({
      where: { id },
      include: {
        classifications: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    })
    if (!entry) return null

    return {
      ...entry,
      themes: JSON.parse(entry.themes || '[]'),
      culturalElements: JSON.parse(entry.culturalElements || '[]'),
      createdAt: new Date(entry.createdAt).toISOString(),
      updatedAt: new Date(entry.updatedAt).toISOString(),
      classifications: entry.classifications.map(c => ({
        ...c,
        classifiedThemes: JSON.parse(c.classifiedThemes || '[]'),
        rulesApplied: JSON.parse(c.rulesApplied || '[]'),
        timestamp: new Date(c.timestamp).toISOString(),
      })),
    }
  },
  ['entry-detail-v4'],
  { tags: ['entries'] }
)

interface Props {
  params: { id: string }
}

export default async function EntryDetailPage({ params }: Props) {
  const parsed = await getCachedEntry(params.id)

  if (!parsed) {
    notFound()
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingTop: '40px', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px 16px' }}>
        <BackButton fallbackHref="/explore" defaultLabel="Back to Explorer" />
      </div>
      <EntryDetail entry={parsed} />
    </main>
  )
}
