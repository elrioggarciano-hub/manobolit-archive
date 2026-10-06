import { notFound } from 'next/navigation'
import { prisma } from '@/lib/database/prisma'
import EntryDetail from '@/components/EntryDetail'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function EntryDetailPage({ params }: Props) {
  const entry = await prisma.literatureEntry.findUnique({
    where: { id: params.id },
    include: {
      classifications: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  })

  if (!entry) {
    notFound()
  }

  const parsed = {
    ...entry,
    themes: JSON.parse(entry.themes || '[]'),
    culturalElements: JSON.parse(entry.culturalElements || '[]'),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    classifications: entry.classifications.map(c => ({
      ...c,
      classifiedThemes: JSON.parse(c.classifiedThemes || '[]'),
      rulesApplied: JSON.parse(c.rulesApplied || '[]'),
      timestamp: c.timestamp.toISOString(),
    })),
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingTop: '40px', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px 16px' }}>
        <Link href="/explore" className="btn-anim" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'var(--brand-accent)', textDecoration: 'none', fontSize: '14px',
          marginBottom: '16px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 'bold',
        }}>
          ← Back to Explorer
        </Link>
      </div>
      <EntryDetail entry={parsed} />
    </main>
  )
}
