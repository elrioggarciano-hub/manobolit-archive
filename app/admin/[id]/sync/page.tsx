import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/database/prisma'
import TranscriptSyncEditor from '@/components/admin/TranscriptSyncEditor'
import { parseSegments } from '@/lib/transcriptSync'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function TranscriptSyncPage({ params }: Props) {
  const entry = await prisma.literatureEntry.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, audioFile: true, transcription: true, transcriptSync: true },
  })
  if (!entry) notFound()

  return (
    <main className="anim-fade-in" style={{ minHeight: '100vh', background: '#020617', paddingTop: '80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Link href="/admin" className="btn-anim" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>← Admin</Link>
          <span style={{ color: '#334155' }}>/</span>
          <Link href={`/admin/${entry.id}/edit`} className="btn-anim" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>{entry.title}</Link>
          <span style={{ color: '#334155' }}>/</span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>Synchronize transcript</h1>
        </div>
        {entry.audioFile ? (
          <TranscriptSyncEditor
            entryId={entry.id}
            audioFile={entry.audioFile}
            transcription={entry.transcription || ''}
            initialSegments={parseSegments(entry.transcriptSync)}
          />
        ) : (
          <p style={{ color: '#94a3b8' }}>This entry has no audio recording. Add an audio file in the entry form first.</p>
        )}
      </div>
    </main>
  )
}
