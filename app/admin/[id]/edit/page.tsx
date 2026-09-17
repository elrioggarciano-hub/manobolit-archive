import { notFound } from 'next/navigation'
import { prisma } from '@/lib/database/prisma'
import EntryForm from '@/components/EntryForm'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function EditEntryPage({ params }: Props) {
  const entry = await prisma.literatureEntry.findUnique({ where: { id: params.id } })
  if (!entry) notFound()

  const initialData = {
    id: entry.id,
    title: entry.title,
    manoboTitle: entry.manoboTitle || '',
    englishTitle: entry.englishTitle || '',
    type: entry.type,
    content: entry.content,
    transcription: entry.transcription || '',
    translation: entry.translation || '',
    audioFile: entry.audioFile || '',
    audioDuration: entry.audioDuration?.toString() || '',
    source: entry.source,
    yearCollected: entry.yearCollected?.toString() || '',
    narrator: entry.narrator || '',
    communityLocation: entry.communityLocation,
    province: entry.province,
    municipality: entry.municipality,
    barangay: entry.barangay || '',
    genre: entry.genre,
    themes: JSON.parse(entry.themes || '[]'),
    culturalElements: (JSON.parse(entry.culturalElements || '[]') as string[]).join(', '),
  }

  return (
    <main style={{ minHeight: '100vh', background: '#020617', paddingTop: '80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <Link href="/admin" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>← Admin</Link>
          <span style={{ color: '#334155' }}>/</span>
          <Link href={`/archive/${entry.id}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>
            {entry.title}
          </Link>
          <span style={{ color: '#334155' }}>/</span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>Edit</h1>
        </div>
        <EntryForm mode="edit" initialData={initialData} />
      </div>
    </main>
  )
}
